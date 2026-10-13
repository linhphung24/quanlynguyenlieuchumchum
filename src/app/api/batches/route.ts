import { NextRequest, NextResponse } from 'next/server';
import { getAllBatches } from '@/services/fifoBatchService';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const status = req.nextUrl.searchParams.get('status') || 'active';

    const batches = await getAllBatches(search, status);
    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
