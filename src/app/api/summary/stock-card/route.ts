import { NextRequest, NextResponse } from 'next/server';
import { getStockCardReport } from '@/services/summaryReportService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get('productName');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!productName || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Thiếu tham số productName, fromDate hoặc toDate.' },
        { status: 400 }
      );
    }

    const report = await getStockCardReport(productName, fromDate, toDate);
    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
