import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      orderType = 'dine_in',
      customerName = '',
      customerPhone = '',
      items = [],
      discountAmount = 0,
      vatAmount = 0,
      createdBy = 'Thu ngân',
    } = body;

    // 1. Get current open shift if available
    const openShift = await executeQuery<any>(
      `SELECT TOP 1 Id FROM PosShifts WHERE Status = 'open' ORDER BY Id DESC`
    );
    const shiftId = openShift[0]?.Id || null;

    let orderId: number | null = null;
    let tableName: string | null = null;

    if (tableId) {
      const tableRows = await executeQuery<any>(
        `SELECT * FROM PosTables WHERE Id = @TableId`,
        { TableId: { type: sql.Int, value: Number(tableId) } }
      );
      if (tableRows.length > 0) {
        tableName = tableRows[0].Name;
        if (tableRows[0].CurrentOrderId) {
          orderId = tableRows[0].CurrentOrderId;
        }
      }
    }

    // Compute subtotal from items - safely handle both camelCase and PascalCase
    let subtotal = 0;
    const normalizedItems = (items || []).map((it: any) => {
      const qty = Number(it.Quantity ?? it.quantity ?? 1) || 1;
      const price = Number(it.Price ?? it.price ?? 0) || 0;
      const discount = Number(it.Discount ?? it.discount ?? 0) || 0;
      const lineSubtotal = Math.max(0, qty * price - discount);
      subtotal += lineSubtotal;

      const menuItemId = it.MenuItemId ?? it.menuItemId ?? it.ProductId ?? it.productId ?? null;
      const productId = it.ProductId ?? it.productId ?? null;
      const productCode = String(it.ProductCode ?? it.productCode ?? '').trim();
      const productName = String(it.ProductName ?? it.productName ?? '').trim();
      const unit = String(it.Unit ?? it.unit ?? 'cái').trim();
      const note = it.Note ?? it.note ?? '';

      return {
        menuItemId: menuItemId ? Number(menuItemId) : null,
        productId: productId ? Number(productId) : null,
        productCode,
        productName,
        unit,
        quantity: qty,
        price,
        discount,
        subtotal: lineSubtotal,
        note: note ? String(note).trim() : null,
      };
    });

    const parsedDiscount = Number(discountAmount) || 0;
    const parsedVat = Number(vatAmount) || 0;
    const finalAmount = Math.max(0, subtotal - parsedDiscount + parsedVat);

    if (!orderId) {
      // Generate OrderCode: ORD-YYYYMMDD-XXXX
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const prefix = `ORD-${yyyy}${mm}${dd}`;

      const countToday = await executeScalar<number>(
        `SELECT COUNT(*) FROM PosOrders WHERE OrderCode LIKE @Prefix`,
        { Prefix: { type: sql.NVarChar(50), value: `${prefix}%` } }
      );
      const seq = String((countToday || 0) + 1).padStart(4, '0');
      const orderCode = `${prefix}-${seq}`;

      // Insert new Order with strict parameterized values
      const insertResult = await executeQuery<any>(
        `INSERT INTO PosOrders (
          OrderCode, ShiftId, TableId, TableName, OrderType, CustomerName, CustomerPhone,
          Subtotal, DiscountAmount, VatAmount, FinalAmount, PaymentStatus, OrderStatus,
          CreatedBy, CreatedAt
        )
        OUTPUT INSERTED.Id
        VALUES (
          @OrderCode, @ShiftId, @TableId, @TableName, @OrderType, @CustomerName, @CustomerPhone,
          @Subtotal, @DiscountAmount, @VatAmount, @FinalAmount, 'unpaid', 'serving',
          @CreatedBy, GETDATE()
        )`,
        {
          OrderCode: { type: sql.NVarChar(50), value: orderCode },
          ShiftId: { type: sql.Int, value: shiftId },
          TableId: { type: sql.Int, value: tableId ? Number(tableId) : null },
          TableName: { type: sql.NVarChar(100), value: tableName },
          OrderType: { type: sql.NVarChar(20), value: orderType },
          CustomerName: { type: sql.NVarChar(100), value: customerName },
          CustomerPhone: { type: sql.NVarChar(20), value: customerPhone },
          Subtotal: { type: sql.Decimal(18, 2), value: subtotal },
          DiscountAmount: { type: sql.Decimal(18, 2), value: parsedDiscount },
          VatAmount: { type: sql.Decimal(18, 2), value: parsedVat },
          FinalAmount: { type: sql.Decimal(18, 2), value: finalAmount },
          CreatedBy: { type: sql.NVarChar(100), value: createdBy },
        }
      );

      orderId = insertResult[0].Id;

      // Link order to table if applicable
      if (tableId) {
        await executeNonQuery(
          `UPDATE PosTables 
           SET Status = 'occupied', CurrentOrderId = @OrderId 
           WHERE Id = @TableId`,
          {
            OrderId: { type: sql.Int, value: orderId },
            TableId: { type: sql.Int, value: Number(tableId) },
          }
        );
      }
    } else {
      // Update existing order subtotal with strict parameterized values
      await executeNonQuery(
        `UPDATE PosOrders SET
          Subtotal = @Subtotal,
          DiscountAmount = @DiscountAmount,
          VatAmount = @VatAmount,
          FinalAmount = @FinalAmount,
          CustomerName = @CustomerName,
          CustomerPhone = @CustomerPhone,
          UpdatedAt = GETDATE()
        WHERE Id = @OrderId`,
        {
          Subtotal: { type: sql.Decimal(18, 2), value: subtotal },
          DiscountAmount: { type: sql.Decimal(18, 2), value: parsedDiscount },
          VatAmount: { type: sql.Decimal(18, 2), value: parsedVat },
          FinalAmount: { type: sql.Decimal(18, 2), value: finalAmount },
          CustomerName: { type: sql.NVarChar(100), value: customerName },
          CustomerPhone: { type: sql.NVarChar(20), value: customerPhone },
          OrderId: { type: sql.Int, value: orderId },
        }
      );

      // Delete old details and re-insert fresh
      await executeNonQuery(
        `DELETE FROM PosOrderDetails WHERE OrderId = @OrderId`,
        { OrderId: { type: sql.Int, value: orderId } }
      );

      // Ensure table status is occupied
      if (tableId) {
        await executeNonQuery(
          `UPDATE PosTables 
           SET Status = 'occupied', CurrentOrderId = @OrderId 
           WHERE Id = @TableId`,
          {
            OrderId: { type: sql.Int, value: orderId },
            TableId: { type: sql.Int, value: Number(tableId) },
          }
        );
      }
    }

    // Insert order details with parameterization
    const insertDetailSql = `
      INSERT INTO PosOrderDetails (
        OrderId, MenuItemId, ProductId, ProductCode, ProductName, Unit,
        Quantity, Price, Discount, Subtotal, Note, Status
      )
      VALUES (
        @OrderId, @MenuItemId, @ProductId, @ProductCode, @ProductName, @Unit,
        @Quantity, @Price, @Discount, @Subtotal, @Note, 'served'
      )
    `;

    for (const it of normalizedItems) {
      await executeNonQuery(insertDetailSql, {
        OrderId: { type: sql.Int, value: orderId },
        MenuItemId: { type: sql.Int, value: it.menuItemId },
        ProductId: { type: sql.Int, value: it.productId },
        ProductCode: { type: sql.NVarChar(50), value: it.productCode || null },
        ProductName: { type: sql.NVarChar(255), value: it.productName || 'Món' },
        Unit: { type: sql.NVarChar(20), value: it.unit || 'cái' },
        Quantity: { type: sql.Decimal(18, 2), value: it.quantity },
        Price: { type: sql.Decimal(18, 2), value: it.price },
        Discount: { type: sql.Decimal(18, 2), value: it.discount },
        Subtotal: { type: sql.Decimal(18, 2), value: it.subtotal },
        Note: { type: sql.NVarChar(255), value: it.note },
      });
    }

    // Fetch complete saved order
    const savedOrder = await executeQuery<any>(
      `SELECT * FROM PosOrders WHERE Id = @OrderId`,
      { OrderId: { type: sql.Int, value: orderId } }
    );
    const details = await executeQuery<any>(
      `SELECT * FROM PosOrderDetails WHERE OrderId = @OrderId ORDER BY Id ASC`,
      { OrderId: { type: sql.Int, value: orderId } }
    );

    return NextResponse.json({
      success: true,
      order: {
        ...savedOrder[0],
        Details: details,
      },
    });
  } catch (error: any) {
    console.error('Error saving POS order:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lưu đơn hàng' }, { status: 500 });
  }
}
