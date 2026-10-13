import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceDetails } from '@/services/invoiceService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const details = await getInvoiceDetails(id);
    return NextResponse.json({ details });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
