import { NextRequest, NextResponse } from 'next/server';
import { rebuildAllFifoBatches } from '@/services/fifoBatchService';
import { logAudit } from '@/lib/audit';
import { getCurrentUser } from '@/lib/serverUtils';

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req, undefined, 'system');
    await rebuildAllFifoBatches();
    await logAudit(currentUser, currentUser, 'REBUILD_FIFO', 'Batches', 'all', 'Tính toán lại toàn bộ dữ liệu lô hàng FIFO');
    return NextResponse.json({ success: true, message: 'Đã rebuild toàn bộ lô hàng FIFO thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
