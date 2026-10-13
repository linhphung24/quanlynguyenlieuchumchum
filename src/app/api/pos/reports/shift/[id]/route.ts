import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const shiftId = parseInt(params.id, 10);
    if (!shiftId) {
      return NextResponse.json({ error: 'Mã ca không hợp lệ' }, { status: 400 });
    }

    const shiftRows = await executeQuery<any>(`SELECT * FROM PosShifts WHERE Id = ${shiftId}`);
    if (shiftRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy ca bán hàng' }, { status: 404 });
    }
    const shift = shiftRows[0];

    // Orders in shift
    const orders = await executeQuery<any>(`
      SELECT * FROM PosOrders 
      WHERE ShiftId = ${shiftId} AND OrderStatus = 'completed'
      ORDER BY Id ASC
    `);

    // Top selling items in shift
    const itemStats = await executeQuery<any>(`
      SELECT 
        d.ProductName,
        d.Unit,
        SUM(d.Quantity) as TotalQty,
        d.Price,
        SUM(d.Subtotal) as TotalAmount
      FROM PosOrderDetails d
      JOIN PosOrders o ON d.OrderId = o.Id
      WHERE o.ShiftId = ${shiftId} AND o.OrderStatus = 'completed'
      GROUP BY d.ProductName, d.Unit, d.Price
      ORDER BY TotalAmount DESC
    `);

    return NextResponse.json({
      shift,
      orders,
      itemStats,
    });
  } catch (error: any) {
    console.error('Error fetching shift report:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy báo cáo ca' }, { status: 500 });
  }
}
