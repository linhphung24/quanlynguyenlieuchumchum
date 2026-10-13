import { NextRequest, NextResponse } from 'next/server';
import { validateFifoTimeline } from '@/services/invoiceService';

export async function POST(req: NextRequest) {
  try {
    const { excludeInvoiceId, invDate, type, details } = await req.json();
    const violations = await validateFifoTimeline(
      Number(excludeInvoiceId) || 0,
      invDate,
      type,
      details || []
    );
    return NextResponse.json({ violations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
