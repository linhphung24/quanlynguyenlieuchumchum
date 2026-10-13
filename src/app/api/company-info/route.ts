import { NextRequest, NextResponse } from 'next/server';
import { getCompanyInfo, saveCompanyInfo } from '@/services/companyInfoService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET() {
  try {
    const info = await getCompanyInfo();
    return NextResponse.json({ info });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');

    await saveCompanyInfo(body, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
