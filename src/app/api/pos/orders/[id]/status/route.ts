import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id, 10);
    if (!orderId) {
      return NextResponse.json({ error: 'Mã đơn không hợp lệ' }, { status: 400 });
    }

    const rows = await executeQuery<any>(
      `SELECT Id, OrderCode, PaymentStatus, OrderStatus, FinalAmount, PaymentMethod, PaidAt FROM PosOrders WHERE Id = ${orderId}`
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: rows[0].Id,
      orderCode: rows[0].OrderCode,
      paymentStatus: rows[0].PaymentStatus,
      orderStatus: rows[0].OrderStatus,
      finalAmount: rows[0].FinalAmount,
      paymentMethod: rows[0].PaymentMethod,
      paidAt: rows[0].PaidAt,
      isPaid: rows[0].PaymentStatus === 'paid',
    });
  } catch (error: any) {
    console.error('Error polling order status:', error);
    return NextResponse.json({ error: error.message || 'Lỗi kiểm tra trạng thái đơn' }, { status: 500 });
  }
}
