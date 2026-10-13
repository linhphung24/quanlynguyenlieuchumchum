import { NextRequest, NextResponse } from 'next/server';
import { getVouchers, saveVoucher } from '@/services/cashVoucherService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const fromDate = req.nextUrl.searchParams.get('fromDate') || '2000-01-01';
    const toDate = req.nextUrl.searchParams.get('toDate') || '2099-12-31';
    const keyword = req.nextUrl.searchParams.get('keyword') || '';
    const type = req.nextUrl.searchParams.get('type') || '';

    const vouchers = await getVouchers(fromDate, toDate, keyword, type);
    return NextResponse.json({ vouchers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voucher, details } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    const newId = await saveVoucher(voucher, details || [], currentUser);
    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
