import { NextRequest, NextResponse } from 'next/server';
import { getSupplierDebtSummary, getSupplierDebtDetail } from '@/services/debtService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    const keyword = searchParams.get('keyword') || '';

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const defaultFrom = new Date(y, m, 1).toISOString().split('T')[0];
    const defaultTo = new Date(y, m + 1, 0).toISOString().split('T')[0];

    const fromDate = searchParams.get('fromDate') || defaultFrom;
    const toDate = searchParams.get('toDate') || defaultTo;

    if (supplierId) {
      const detail = await getSupplierDebtDetail(Number(supplierId), fromDate, toDate);
      if (!detail) {
        return NextResponse.json({ error: 'Không tìm thấy thông tin nhà cung cấp' }, { status: 404 });
      }
      return NextResponse.json({ detail });
    }

    const result = await getSupplierDebtSummary(fromDate, toDate, keyword);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching debts:', err);
    return NextResponse.json({ error: err.message || 'Lỗi lấy dữ liệu công nợ' }, { status: 500 });
  }
}
