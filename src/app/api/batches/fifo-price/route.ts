import { NextRequest, NextResponse } from 'next/server';
import { getFifoPriceForProduct } from '@/services/fifoBatchService';

export async function GET(req: NextRequest) {
  try {
    const productName = req.nextUrl.searchParams.get('productName');
    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { error: 'Thiếu tên sản phẩm (productName)' },
        { status: 400 }
      );
    }

    const qtyStr = req.nextUrl.searchParams.get('qty');
    const qty = qtyStr ? parseFloat(qtyStr.replace(',', '.')) : 0;

    const fallbackStr = req.nextUrl.searchParams.get('fallbackPrice');
    const fallbackPrice = fallbackStr ? parseFloat(fallbackStr.replace(',', '.')) : 0;

    const result = await getFifoPriceForProduct(
      productName.trim(),
      isNaN(qty) ? 0 : qty,
      isNaN(fallbackPrice) ? 0 : fallbackPrice
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
