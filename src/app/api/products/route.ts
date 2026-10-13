import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, saveProduct, deleteProduct } from '@/services/productService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const products = await getAllProducts(search);
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');
    const newId = await saveProduct(body, currentUser);
    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const currentUser = getCurrentUser(req, undefined, 'system');
    await deleteProduct(Number(id), currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
