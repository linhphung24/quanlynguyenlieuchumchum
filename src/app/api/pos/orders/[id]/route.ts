import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id, 10);
    if (!orderId) {
      return NextResponse.json({ error: 'Mã đơn không hợp lệ' }, { status: 400 });
    }

    const orderRows = await executeQuery<any>(`SELECT * FROM PosOrders WHERE Id = ${orderId}`);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const details = await executeQuery<any>(
      `SELECT * FROM PosOrderDetails WHERE OrderId = ${orderId} ORDER BY Id ASC`
    );

    return NextResponse.json({
      ...orderRows[0],
      Details: details,
    });
  } catch (error: any) {
    console.error('Error getting POS order details:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy chi tiết đơn hàng' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id, 10);
    if (!orderId) {
      return NextResponse.json({ error: 'Mã đơn không hợp lệ' }, { status: 400 });
    }

    const orderRows = await executeQuery<any>(`SELECT * FROM PosOrders WHERE Id = ${orderId}`);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const order = orderRows[0];

    // Free the table if any
    if (order.TableId) {
      await executeNonQuery(`
        UPDATE PosTables 
        SET Status = 'available', CurrentOrderId = NULL 
        WHERE Id = ${order.TableId} AND CurrentOrderId = ${orderId}
      `);
    }

    // Cancel order
    await executeNonQuery(`
      UPDATE PosOrders 
      SET OrderStatus = 'cancelled', PaymentStatus = 'cancelled', UpdatedAt = GETDATE()
      WHERE Id = ${orderId}
    `);

    return NextResponse.json({ success: true, message: 'Đã hủy đơn hàng' });
  } catch (error: any) {
    console.error('Error cancelling POS order:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hủy đơn hàng' }, { status: 500 });
  }
}
