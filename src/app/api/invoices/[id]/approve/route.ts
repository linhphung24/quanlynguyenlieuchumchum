import { NextRequest, NextResponse } from 'next/server';
import { applyApproval } from '@/services/invoiceService';
import { getCurrentUser, getSafeHeaderRole } from '@/lib/serverUtils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');
    const userRole = getSafeHeaderRole(req, '');

    // Only accountant, manager, or admin can approve invoices
    if (userRole && !['admin', 'manager', 'ketoan', 'accountant'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Chỉ kế toán hoặc quản lý mới có quyền phê duyệt chứng từ kho!' },
        { status: 403 }
      );
    }

    const statusParam = body.status || (body.approve ? 'approved' : 'rejected');
    await applyApproval(id, statusParam, currentUser);
    return NextResponse.json({ success: true, status: statusParam });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
