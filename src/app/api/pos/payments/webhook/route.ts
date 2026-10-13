import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[POS Payment Webhook Received]:', JSON.stringify(body));

    // Handle SePay payload format or Casso or PayOS
    // SePay format: { id, gateway, transferType: 'in', transferAmount, content, referenceCode }
    // Casso format: { data: [{ amount, description, tid, ... }] }
    // PayOS format: { data: { orderCode, amount, description, reference, ... } }

    let amount = 0;
    let content = '';
    let referenceCode = '';

    if (body.transferType === 'in' || body.transferAmount !== undefined) {
      // SePay
      amount = Number(body.transferAmount || 0);
      content = String(body.content || '');
      referenceCode = String(body.referenceCode || body.id || '');
    } else if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      // Casso
      const item = body.data[0];
      amount = Number(item.amount || 0);
      content = String(item.description || '');
      referenceCode = String(item.tid || '');
    } else if (body.data && body.data.orderCode) {
      // PayOS
      amount = Number(body.data.amount || 0);
      content = String(body.data.description || '');
      referenceCode = String(body.data.reference || '');
    } else {
      amount = Number(body.amount || 0);
      content = String(body.content || body.description || '');
      referenceCode = String(body.referenceCode || body.id || '');
    }

    if (amount <= 0 || !content) {
      return NextResponse.json({ success: false, message: 'Dữ liệu webhook không hợp lệ' }, { status: 400 });
    }

    // Try finding order code inside content. Example: "CCB ORD-20261006-0001" or "ORD-20261006-0001" or numeric ID
    const upperContent = content.toUpperCase();
    const orderMatch = upperContent.match(/ORD-\d{8}-\d{4}/);
    let matchedOrderCode = orderMatch ? orderMatch[0] : null;

    let targetOrder = null;

    if (matchedOrderCode) {
      const orders = await executeQuery<any>(
        `SELECT * FROM PosOrders WHERE OrderCode = '${matchedOrderCode}' AND PaymentStatus = 'unpaid'`
      );
      if (orders.length > 0) {
        targetOrder = orders[0];
      }
    }

    // Fallback: search for Order by ID if content has e.g. "CCB 12"
    if (!targetOrder) {
      const idMatch = upperContent.match(/CCB\s*(\d+)/);
      if (idMatch && idMatch[1]) {
        const orderId = parseInt(idMatch[1], 10);
        const orders = await executeQuery<any>(
          `SELECT * FROM PosOrders WHERE Id = ${orderId} AND PaymentStatus = 'unpaid'`
        );
        if (orders.length > 0) {
          targetOrder = orders[0];
        }
      }
    }

    if (!targetOrder) {
      console.warn(`[POS Webhook] Không tìm thấy đơn hàng tương ứng với nội dung: "${content}"`);
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng chờ thanh toán' });
    }

    // Verify amount (allow >= finalAmount)
    if (amount < targetOrder.FinalAmount) {
      console.warn(`[POS Webhook] Số tiền chuyển ${amount} nhỏ hơn số tiền đơn ${targetOrder.FinalAmount}`);
      return NextResponse.json({ success: false, message: 'Số tiền chuyển không đủ' }, { status: 400 });
    }

    const orderId = targetOrder.Id;

    // 1. Mark order as paid via qr_transfer
    await executeNonQuery(`
      UPDATE PosOrders SET
        PaymentMethod = 'qr_transfer',
        CashReceived = ${amount},
        CashChange = 0,
        PaymentStatus = 'paid',
        OrderStatus = 'completed',
        TransactionRef = '${referenceCode.replace(/'/g, "''")}',
        PaidAt = GETDATE(),
        UpdatedAt = GETDATE()
      WHERE Id = ${orderId}
    `);

    // 2. Free Table
    if (targetOrder.TableId) {
      await executeNonQuery(`
        UPDATE PosTables 
        SET Status = 'available', CurrentOrderId = NULL 
        WHERE Id = ${targetOrder.TableId} AND CurrentOrderId = ${orderId}
      `);
    }

    // 3. Deduct stock from Products table
    const details = await executeQuery<any>(
      `SELECT ProductId, Quantity FROM PosOrderDetails WHERE OrderId = ${orderId}`
    );
    for (const d of details) {
      if (d.ProductId && d.Quantity > 0) {
        await executeNonQuery(`
          UPDATE Products 
          SET StockQty = StockQty - ${d.Quantity}, UpdatedAt = GETDATE() 
          WHERE Id = ${d.ProductId}
        `);
      }
    }

    // 4. Update Shift
    if (targetOrder.ShiftId) {
      await executeNonQuery(`
        UPDATE PosShifts 
        SET TotalQRSales = TotalQRSales + ${targetOrder.FinalAmount} 
        WHERE Id = ${targetOrder.ShiftId}
      `);
    }

    console.log(`[POS Webhook] Đơn hàng #${targetOrder.OrderCode} đã thanh toán tự động thành công!`);

    return NextResponse.json({
      success: true,
      message: 'Xác nhận thanh toán tự động thành công',
      orderCode: targetOrder.OrderCode,
    });
  } catch (error: any) {
    console.error('Error handling payment webhook:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý webhook' }, { status: 500 });
  }
}
