import { NextRequest, NextResponse } from 'next/server';
import { nextCode } from '@/services/cashVoucherService';

export async function GET(req: NextRequest) {
  try {
    const type = (req.nextUrl.searchParams.get('type') || 'chi') as 'thu' | 'chi';
    const code = await nextCode(type);
    return NextResponse.json({ code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
