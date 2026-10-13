import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { deductBatchesFifo } from '@/services/fifoBatchService';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id, 10);
    if (!orderId) {
      return NextResponse.json({ error: 'Mã đơn không hợp lệ' }, { status: 400 });
    }

    const body = await req.json();
    const {
      paymentMethod = 'cash', // 'cash' | 'qr_transfer' | 'card'
      cashReceived = 0,
      cashChange = 0,
      transactionRef = '',
    } = body;

    const orderRows = await executeQuery<any>(`SELECT * FROM PosOrders WHERE Id = @OrderId`, {
      OrderId: { type: sql.Int, value: orderId },
    });
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const order = orderRows[0];

    if (order.PaymentStatus === 'paid') {
      return NextResponse.json({ success: true, message: 'Đơn hàng đã được thanh toán trước đó' });
    }

    const finalAmount = order.FinalAmount;

    // 1. Update Order status
    await executeNonQuery(
      `UPDATE PosOrders SET
        PaymentMethod = @PaymentMethod,
        CashReceived = @CashReceived,
        CashChange = @CashChange,
        PaymentStatus = 'paid',
        OrderStatus = 'completed',
        TransactionRef = @TransactionRef,
        PaidAt = GETDATE(),
        UpdatedAt = GETDATE()
      WHERE Id = @OrderId`,
      {
        PaymentMethod: { type: sql.NVarChar(20), value: paymentMethod },
        CashReceived: { type: sql.Decimal(18, 2), value: cashReceived },
        CashChange: { type: sql.Decimal(18, 2), value: cashChange },
        TransactionRef: { type: sql.NVarChar(100), value: transactionRef || null },
        OrderId: { type: sql.Int, value: orderId },
      }
    );

    // 2. Free Table
    if (order.TableId) {
      await executeNonQuery(
        `UPDATE PosTables 
         SET Status = 'available', CurrentOrderId = NULL 
         WHERE Id = @TableId AND CurrentOrderId = @OrderId`,
        {
          TableId: { type: sql.Int, value: order.TableId },
          OrderId: { type: sql.Int, value: orderId },
        }
      );
    }

    // 3. Deduct stock based on recipe (định mức nguyên vật liệu) if available
    const orderDetails = await executeQuery<any>(
      `SELECT Id, OrderId, ProductId, MenuItemId, ProductCode, ProductName, Unit, Quantity, Price
       FROM PosOrderDetails 
       WHERE OrderId = @OrderId AND Status <> 'cancelled'`,
      { OrderId: { type: sql.Int, value: orderId } }
    );

    // Map to aggregate materials to deduct: key -> { productId, productName, unit, amount, price }
    const materialsToDeduct = new Map<
      string,
      {
        productId: number | null;
        productName: string;
        unit: string;
        amount: number;
        price: number;
      }
    >();

    for (const d of orderDetails) {
      const orderQty = Number(d.Quantity) || 0;
      if (orderQty <= 0) continue;

      // Find matching PosMenuItem: by MenuItemId or ProductCode or ProductName
      const menuItemRows = await executeQuery<any>(
        `SELECT TOP 1 Id, Code, Name FROM PosMenuItems 
         WHERE (@MenuItemId IS NOT NULL AND Id = @MenuItemId)
            OR (@ProductCode IS NOT NULL AND Code = @ProductCode)
            OR LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@ProductName)))`,
        {
          MenuItemId: { type: sql.Int, value: d.MenuItemId || d.ProductId || null },
          ProductCode: { type: sql.NVarChar(50), value: d.ProductCode || null },
          ProductName: { type: sql.NVarChar(255), value: d.ProductName },
        }
      );

      let foundRecipes: any[] = [];
      if (menuItemRows.length > 0) {
        const menuItemId = menuItemRows[0].Id;
        // Query recipe ingredients for this menu item
        foundRecipes = await executeQuery<any>(
          `SELECT r.ProductId, r.ProductName, r.Amount, r.Unit, r.CostPrice,
                  p.Id AS WarehouseProdId, p.Unit AS WarehouseProdUnit, p.CostPrice AS WarehouseProdPrice
           FROM PosMenuItemRecipes r
           LEFT JOIN Products p ON (r.ProductId = p.Id OR LOWER(LTRIM(RTRIM(r.ProductName))) = LOWER(LTRIM(RTRIM(p.Name))))
           WHERE r.MenuItemId = @MenuItemId`,
          { MenuItemId: { type: sql.Int, value: menuItemId } }
        );
      }

      if (foundRecipes.length > 0) {
        // Recipe found: deduct raw materials according to recipe BOM!
        for (const r of foundRecipes) {
          const reqAmount = orderQty * (Number(r.Amount) || 0);
          if (reqAmount <= 0) continue;

          const pName = (r.ProductName || '').trim();
          const key = pName.toLowerCase();

          if (!materialsToDeduct.has(key)) {
            materialsToDeduct.set(key, {
              productId: r.WarehouseProdId || r.ProductId || null,
              productName: pName,
              unit: r.WarehouseProdUnit || r.Unit || 'g',
              amount: 0,
              price: Number(r.WarehouseProdPrice) || Number(r.CostPrice) || 0,
            });
          }
          materialsToDeduct.get(key)!.amount += reqAmount;
        }
      } else {
        // No recipe defined for this item.
        // Check if item itself is directly a warehouse product (hàng bán sẵn trong kho Products)
        const directProdRows = await executeQuery<any>(
          `SELECT TOP 1 Id, Name, Unit, CostPrice FROM Products 
           WHERE (@ProdId IS NOT NULL AND Id = @ProdId)
              OR LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@ProductName)))`,
          {
            ProdId: { type: sql.Int, value: d.ProductId || null },
            ProductName: { type: sql.NVarChar(255), value: d.ProductName },
          }
        );

        // If it's a finished product sold directly and exists in warehouse Products, deduct it
        if (directProdRows.length > 0) {
          const p = directProdRows[0];
          const key = p.Name.trim().toLowerCase();
          if (!materialsToDeduct.has(key)) {
            materialsToDeduct.set(key, {
              productId: p.Id,
              productName: p.Name.trim(),
              unit: p.Unit || d.Unit || 'cái',
              amount: 0,
              price: Number(p.CostPrice) || Number(d.Price) || 0,
            });
          }
          materialsToDeduct.get(key)!.amount += orderQty;
        }
      }
    }

    // 4. Create Export Invoice & Deduct Batches FIFO if there are materials to deduct
    let exportInvoiceId: number | null = null;
    if (materialsToDeduct.size > 0) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const invCode = `XKBH-${order.OrderCode}`;

      // Check if an export invoice already exists for this order
      const existingInv = await executeQuery<any>(
        `SELECT TOP 1 Id FROM Invoices WHERE Code = @Code`,
        { Code: { type: sql.NVarChar(50), value: invCode } }
      );

      if (existingInv.length > 0) {
        exportInvoiceId = existingInv[0].Id;
      } else {
        const insertInvSql = `
          INSERT INTO Invoices (
            Type, InvDate, Code, Partner, Note, CreatedBy, CreatedAt,
            ApprovalStatus, ApprovedBy, ApprovedAt
          )
          OUTPUT INSERTED.Id
          VALUES (
            'out', @InvDate, @Code, @Partner, @Note, @CreatedBy, GETDATE(),
            'approved', @CreatedBy, GETDATE()
          )
        `;

        const partnerText = `Bán lẻ POS (${order.OrderCode})${order.TableName ? ` - ${order.TableName}` : ''}`;
        const noteText = `Xuất kho NVL bán hàng theo định mức - Đơn ${order.OrderCode}`;
        const createdByText = order.CreatedBy || 'Thu ngân POS';

        exportInvoiceId = await executeScalar<number>(insertInvSql, {
          InvDate: { type: sql.Date, value: dateStr },
          Code: { type: sql.NVarChar(50), value: invCode },
          Partner: { type: sql.NVarChar(255), value: partnerText },
          Note: { type: sql.NVarChar(sql.MAX), value: noteText },
          CreatedBy: { type: sql.NVarChar(100), value: createdByText },
        });

        // Insert InvoiceDetails
        const insertDetailSql = `
          INSERT INTO InvoiceDetails (InvoiceId, ProductId, ProductName, Unit, Amount, Price, Subtotal)
          VALUES (@InvoiceId, @ProductId, @ProductName, @Unit, @Amount, @Price, @Subtotal)
        `;

        const fifoDeductList: Array<{ productName: string; qty: number; unit: string }> = [];

        for (const mat of Array.from(materialsToDeduct.values())) {
          const roundedAmount = Number(mat.amount.toFixed(4));
          const subtotal = Math.round(roundedAmount * mat.price);

          await executeNonQuery(insertDetailSql, {
            InvoiceId: { type: sql.Int, value: exportInvoiceId },
            ProductId: { type: sql.Int, value: mat.productId },
            ProductName: { type: sql.NVarChar(255), value: mat.productName },
            Unit: { type: sql.NVarChar(50), value: mat.unit },
            Amount: { type: sql.Decimal(18, 4), value: roundedAmount },
            Price: { type: sql.Decimal(18, 2), value: mat.price },
            Subtotal: { type: sql.Decimal(18, 2), value: subtotal },
          });

          // Also reduce StockQty in Products table for fast querying
          if (mat.productId) {
            await executeNonQuery(
              `UPDATE Products 
               SET StockQty = StockQty - @Amount, UpdatedAt = GETDATE() 
               WHERE Id = @ProductId`,
              {
                Amount: { type: sql.Decimal(18, 4), value: roundedAmount },
                ProductId: { type: sql.Int, value: mat.productId },
              }
            );
          } else {
            await executeNonQuery(
              `UPDATE Products 
               SET StockQty = StockQty - @Amount, UpdatedAt = GETDATE() 
               WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@ProductName)))`,
              {
                Amount: { type: sql.Decimal(18, 4), value: roundedAmount },
                ProductName: { type: sql.NVarChar(255), value: mat.productName },
              }
            );
          }

          fifoDeductList.push({
            productName: mat.productName,
            qty: roundedAmount,
            unit: mat.unit,
          });
        }

        // Deduct FIFO batches
        try {
          if (fifoDeductList.length > 0 && exportInvoiceId) {
            await deductBatchesFifo(exportInvoiceId, invCode, dateStr, fifoDeductList);
          }
        } catch (fifoErr) {
          console.error('Error deducting FIFO batches for POS order:', fifoErr);
        }

        // Link ExportInvoiceId to PosOrders
        await executeNonQuery(
          `UPDATE PosOrders SET ExportInvoiceId = @ExportInvoiceId WHERE Id = @OrderId`,
          {
            ExportInvoiceId: { type: sql.Int, value: exportInvoiceId },
            OrderId: { type: sql.Int, value: orderId },
          }
        );

        await logAudit(
          createdByText,
          createdByText,
          'EXPORT_POS',
          'Invoice',
          String(exportInvoiceId),
          `Tự động xuất kho NVL theo định mức cho đơn hàng POS: ${order.OrderCode}`
        );
      }
    }

    // 5. Update Shift sales
    const shiftId = order.ShiftId;
    if (shiftId) {
      if (paymentMethod === 'cash') {
        await executeNonQuery(
          `UPDATE PosShifts SET TotalCashSales = TotalCashSales + @Amount WHERE Id = @ShiftId`,
          { Amount: { type: sql.Decimal(18, 2), value: finalAmount }, ShiftId: { type: sql.Int, value: shiftId } }
        );
      } else if (paymentMethod === 'qr_transfer') {
        await executeNonQuery(
          `UPDATE PosShifts SET TotalQRSales = TotalQRSales + @Amount WHERE Id = @ShiftId`,
          { Amount: { type: sql.Decimal(18, 2), value: finalAmount }, ShiftId: { type: sql.Int, value: shiftId } }
        );
      } else {
        await executeNonQuery(
          `UPDATE PosShifts SET TotalOtherSales = TotalOtherSales + @Amount WHERE Id = @ShiftId`,
          { Amount: { type: sql.Decimal(18, 2), value: finalAmount }, ShiftId: { type: sql.Int, value: shiftId } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thanh toán thành công & đã trừ kho theo định mức',
      orderId,
      finalAmount,
      paymentMethod,
      exportInvoiceId,
      deductedMaterialsCount: materialsToDeduct.size,
    });
  } catch (error: any) {
    console.error('Error processing POS order payment:', error);
    return NextResponse.json({ error: error.message || 'Lỗi thanh toán đơn hàng' }, { status: 500 });
  }
}
