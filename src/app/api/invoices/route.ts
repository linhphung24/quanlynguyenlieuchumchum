import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoices, saveInvoice } from '@/services/invoiceService';
import { getCurrentUser, getSafeHeaderRole } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const fromDate = req.nextUrl.searchParams.get('fromDate') || '2000-01-01';
    const toDate = req.nextUrl.searchParams.get('toDate') || '2099-12-31';
    const keyword = req.nextUrl.searchParams.get('keyword') || '';
    const type = req.nextUrl.searchParams.get('type') || '';

    const invoices = await getAllInvoices(fromDate, toDate, keyword, type);
    return NextResponse.json({ invoices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice, details, sourceModule } = body;
    const currentUser = getCurrentUser(req, body, 'system');
    const userRole = getSafeHeaderRole(req, 'staff');
    const canApproveHeader = req.headers.get('x-can-approve') === 'true';

    // Invoices from warehouse always require accountant approval
    const isApproverRole = ['admin', 'manager', 'ketoan', 'accountant'].includes(userRole);
    const isApprover =
      isApproverRole &&
      sourceModule !== 'warehouse' &&
      canApproveHeader;

    const result = await saveInvoice(invoice, details || [], currentUser, isApprover);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
