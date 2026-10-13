import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db';

export async function GET() {
  try {
    const floors = await executeQuery<any>(
      `SELECT * FROM PosFloors WHERE IsActive = 1 ORDER BY SortOrder ASC`
    );

    const tables = await executeQuery<any>(`
      SELECT 
        t.*,
        o.OrderCode,
        o.Subtotal,
        o.DiscountAmount,
        o.FinalAmount,
        o.PaymentStatus,
        o.CreatedAt as OrderCreatedAt,
        o.CustomerName,
        o.OrderType
      FROM PosTables t
      LEFT JOIN PosOrders o ON t.CurrentOrderId = o.Id
      WHERE t.IsActive = 1
      ORDER BY t.FloorId ASC, t.SortOrder ASC
    `);

    // Fetch details for currently open orders
    const activeOrderIds = tables
      .filter((t) => t.CurrentOrderId)
      .map((t) => t.CurrentOrderId);

    let orderDetailsMap: Record<number, any[]> = {};
    if (activeOrderIds.length > 0) {
      const details = await executeQuery<any>(`
        SELECT * FROM PosOrderDetails 
        WHERE OrderId IN (${activeOrderIds.join(',')})
        ORDER BY Id ASC
      `);
      for (const d of details) {
        if (!orderDetailsMap[d.OrderId]) orderDetailsMap[d.OrderId] = [];
        orderDetailsMap[d.OrderId].push(d);
      }
    }

    const tablesWithOrder = tables.map((t) => {
      let order = null;
      if (t.CurrentOrderId) {
        order = {
          Id: t.CurrentOrderId,
          OrderCode: t.OrderCode,
          Subtotal: t.Subtotal,
          DiscountAmount: t.DiscountAmount,
          FinalAmount: t.FinalAmount,
          PaymentStatus: t.PaymentStatus,
          CreatedAt: t.OrderCreatedAt,
          CustomerName: t.CustomerName,
          OrderType: t.OrderType,
          Details: orderDetailsMap[t.CurrentOrderId] || [],
        };
      }
      return {
        ...t,
        CurrentOrder: order,
      };
    });

    return NextResponse.json({ floors, tables: tablesWithOrder });
  } catch (error: any) {
    console.error('Error fetching POS tables:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy danh sách bàn' }, { status: 500 });
  }
}

// Action: Move table or merge table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sourceTableId, targetTableId } = body;

    if (action === 'move') {
      // Move order from sourceTable to targetTable
      const sourceTable = await executeQuery<any>(
        `SELECT * FROM PosTables WHERE Id = ${sourceTableId}`
      );
      const targetTable = await executeQuery<any>(
        `SELECT * FROM PosTables WHERE Id = ${targetTableId}`
      );

      if (!sourceTable[0] || !sourceTable[0].CurrentOrderId) {
        return NextResponse.json({ error: 'Bàn nguồn không có đơn hàng' }, { status: 400 });
      }
      if (targetTable[0].Status !== 'available' && targetTable[0].CurrentOrderId) {
        return NextResponse.json({ error: 'Bàn đích đang có khách, vui lòng chọn gộp bàn' }, { status: 400 });
      }

      const orderId = sourceTable[0].CurrentOrderId;

      // Update Order
      await executeNonQuery(
        `UPDATE PosOrders SET TableId = ${targetTableId}, TableName = N'${targetTable[0].Name}' WHERE Id = ${orderId}`
      );
      // Update Target Table
      await executeNonQuery(
        `UPDATE PosTables SET Status = 'occupied', CurrentOrderId = ${orderId} WHERE Id = ${targetTableId}`
      );
      // Free Source Table
      await executeNonQuery(
        `UPDATE PosTables SET Status = 'available', CurrentOrderId = NULL WHERE Id = ${sourceTableId}`
      );

      return NextResponse.json({ success: true, message: 'Chuyển bàn thành công' });
    }

    if (action === 'merge') {
      // Merge source order items into target order
      const sourceTable = await executeQuery<any>(
        `SELECT * FROM PosTables WHERE Id = ${sourceTableId}`
      );
      const targetTable = await executeQuery<any>(
        `SELECT * FROM PosTables WHERE Id = ${targetTableId}`
      );

      if (!sourceTable[0]?.CurrentOrderId || !targetTable[0]?.CurrentOrderId) {
        return NextResponse.json({ error: 'Cả 2 bàn đều phải có đơn hàng để gộp' }, { status: 400 });
      }

      const sOrderId = sourceTable[0].CurrentOrderId;
      const tOrderId = targetTable[0].CurrentOrderId;

      // Move items from source order to target order
      await executeNonQuery(
        `UPDATE PosOrderDetails SET OrderId = ${tOrderId} WHERE OrderId = ${sOrderId}`
      );

      // Re-sum target order subtotal
      const sumResult = await executeQuery<any>(
        `SELECT SUM(Subtotal) as Total FROM PosOrderDetails WHERE OrderId = ${tOrderId}`
      );
      const newTotal = sumResult[0]?.Total || 0;

      await executeNonQuery(
        `UPDATE PosOrders SET Subtotal = ${newTotal}, FinalAmount = ${newTotal} - DiscountAmount + VatAmount WHERE Id = ${tOrderId}`
      );

      // Cancel source order
      await executeNonQuery(
        `UPDATE PosOrders SET OrderStatus = 'cancelled', PaymentStatus = 'cancelled' WHERE Id = ${sOrderId}`
      );

      // Free source table
      await executeNonQuery(
        `UPDATE PosTables SET Status = 'available', CurrentOrderId = NULL WHERE Id = ${sourceTableId}`
      );

      return NextResponse.json({ success: true, message: 'Gộp bàn thành công' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Error moving/merging table:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý bàn' }, { status: 500 });
  }
}
