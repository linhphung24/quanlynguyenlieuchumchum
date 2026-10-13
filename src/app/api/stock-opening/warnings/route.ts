import { NextRequest, NextResponse } from 'next/server';
import { getDoubleCountWarnings } from '@/services/stockOpeningService';

export async function POST(req: NextRequest) {
  try {
    const { month, year, stocks } = await req.json();
    const warnings = await getDoubleCountWarnings(Number(month), Number(year), stocks || []);
    return NextResponse.json({ warnings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
