import { NextRequest, NextResponse } from 'next/server';
import { getCashReport } from '@/services/cashVoucherService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const defaultFrom = new Date(y, m, 1).toISOString().split('T')[0];
    const defaultTo = new Date(y, m + 1, 0).toISOString().split('T')[0];

    const fromDate = searchParams.get('fromDate') || defaultFrom;
    const toDate = searchParams.get('toDate') || defaultTo;
    const keyword = searchParams.get('keyword') || '';

    const report = await getCashReport(fromDate, toDate, keyword);
    return NextResponse.json({ report });
  } catch (err: any) {
    console.error('Error fetching cash report:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi lấy báo cáo sổ quỹ tiền mặt' },
      { status: 500 }
    );
  }
}
