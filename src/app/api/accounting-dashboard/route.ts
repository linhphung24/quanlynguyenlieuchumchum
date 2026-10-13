import { NextRequest, NextResponse } from 'next/server';
import { getAccountingDashboard } from '@/services/accountingDashboardService';

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

    const data = await getAccountingDashboard(fromDate, toDate);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Accounting dashboard API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
