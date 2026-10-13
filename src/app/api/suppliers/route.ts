import { NextRequest, NextResponse } from 'next/server';
import { getAllSuppliers, saveSupplier, deleteSupplier } from '@/services/supplierService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get('keyword') || '';
    const suppliers = await getAllSuppliers(keyword);
    return NextResponse.json({ suppliers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');

    await saveSupplier(body, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const currentUser = getCurrentUser(req, undefined, 'system');

    await deleteSupplier(Number(id), currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
