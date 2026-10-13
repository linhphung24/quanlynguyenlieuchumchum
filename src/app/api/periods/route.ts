import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAccountingPeriods,
  getPeriodStatus,
  setPeriodLock,
} from '@/services/periodLockService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    if (yearStr && monthStr) {
      const status = await getPeriodStatus(Number(yearStr), Number(monthStr));
      return NextResponse.json(status);
    }

    const periods = await getAllAccountingPeriods();
    return NextResponse.json({ periods });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, isLocked, note } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Thiếu thông tin năm hoặc tháng kỳ kế toán.' },
        { status: 400 }
      );
    }

    await setPeriodLock(Number(year), Number(month), Boolean(isLocked), currentUser, note || '');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
