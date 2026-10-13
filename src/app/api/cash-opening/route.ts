import { NextRequest, NextResponse } from 'next/server';
import { getCashOpeningBalance, saveCashOpeningBalance } from '@/services/cashVoucherService';
import { getCurrentUser } from '@/lib/serverUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const opening = await getCashOpeningBalance();
    return NextResponse.json({ opening });
  } catch (err: any) {
    console.error('Error fetching cash opening balance:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi lấy số dư tiền mặt đầu kỳ' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');
    const { openingDate, openingAmount, note } = body;

    await saveCashOpeningBalance(
      openingDate || '2026-01-01',
      Number(openingAmount) || 0,
      note || '',
      currentUser
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving cash opening balance:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi lưu số dư tiền mặt đầu kỳ' },
      { status: 500 }
    );
  }
}
