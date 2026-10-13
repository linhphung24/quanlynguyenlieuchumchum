import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/services/invoiceService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const invoice = await getInvoiceById(id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { invoice, details } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    await updateInvoice(id, invoice, details || [], currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const currentUser = getCurrentUser(req, undefined, 'system');

    await deleteInvoice(id, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
