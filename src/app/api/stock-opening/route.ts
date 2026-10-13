import { NextRequest, NextResponse } from 'next/server';
import {
  getOpeningStocks,
  getOpeningPeriod,
  saveOpeningStocks,
  deleteOpeningStock,
} from '@/services/stockOpeningService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const monthStr = req.nextUrl.searchParams.get('month');
    const yearStr = req.nextUrl.searchParams.get('year');

    if (!monthStr || !yearStr) {
      const period = await getOpeningPeriod();
      const stocks = await getOpeningStocks(period.month, period.year);
      return NextResponse.json({ period, stocks });
    }

    const month = Number(monthStr);
    const year = Number(yearStr);
    const stocks = await getOpeningStocks(month, year);
    return NextResponse.json({ stocks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, stocks } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    await saveOpeningStocks(Number(month), Number(year), stocks || [], currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const productName = req.nextUrl.searchParams.get('productName');
    const month = Number(req.nextUrl.searchParams.get('month'));
    const year = Number(req.nextUrl.searchParams.get('year'));
    const currentUser = getCurrentUser(req, undefined, 'system');

    if (!productName || !month || !year) {
      return NextResponse.json({ error: 'Thiếu thông tin productName, month, year' }, { status: 400 });
    }

    await deleteOpeningStock(productName, month, year, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
