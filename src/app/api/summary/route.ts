import { NextRequest, NextResponse } from 'next/server';
import { getInventorySummary } from '@/services/summaryReportService';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const year = Number(req.nextUrl.searchParams.get('year')) || now.getFullYear();
    const month = Number(req.nextUrl.searchParams.get('month')) || now.getMonth() + 1;

    const data = await getInventorySummary(year, month);
    return NextResponse.json({ summary: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
