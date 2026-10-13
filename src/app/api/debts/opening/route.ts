import { NextRequest, NextResponse } from 'next/server';
import {
  getSupplierOpeningDebts,
  saveSupplierOpeningDebt,
  saveBulkSupplierOpeningDebts,
} from '@/services/debtService';
import { getCurrentUser } from '@/lib/serverUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const suppliers = await getSupplierOpeningDebts();
    return NextResponse.json({ suppliers });
  } catch (err: any) {
    console.error('Error fetching supplier opening debts:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi lấy danh sách số dư đầu kỳ' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');

    if (Array.isArray(body.items)) {
      await saveBulkSupplierOpeningDebts(body.items, currentUser);
      return NextResponse.json({ success: true, count: body.items.length });
    }

    const { supplierId, openingDebt, openingDate, note } = body;
    if (!supplierId) {
      return NextResponse.json({ error: 'Thiếu mã Nhà cung cấp (supplierId)' }, { status: 400 });
    }

    await saveSupplierOpeningDebt(
      Number(supplierId),
      Number(openingDebt) || 0,
      openingDate || '2026-01-01',
      note || '',
      currentUser
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving supplier opening debt:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi lưu số dư đầu kỳ' },
      { status: 500 }
    );
  }
}
