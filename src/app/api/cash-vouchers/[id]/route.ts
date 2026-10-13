import { NextRequest, NextResponse } from 'next/server';
import {
  getVoucherById,
  getVoucherDetails,
  updateVoucher,
  deleteVoucher,
} from '@/services/cashVoucherService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const voucher = await getVoucherById(id);
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    const details = await getVoucherDetails(id);
    return NextResponse.json({ voucher, details });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { voucher, details } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    await updateVoucher(id, voucher, details || [], currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const currentUser = getCurrentUser(req, undefined, 'system');

    await deleteVoucher(id, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
