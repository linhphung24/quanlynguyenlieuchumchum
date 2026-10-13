import { NextRequest, NextResponse } from 'next/server';
import { getAllMenuItems, saveMenuItem, getMenuCategories } from '@/services/menuService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const items = await getAllMenuItems(search, category, onlyActive);
    const categories = await getMenuCategories();

    return NextResponse.json({ items, categories });
  } catch (err: any) {
    console.error('Error fetching menu items:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');
    const { item, recipes = [] } = body;

    if (!item || !item.Name) {
      return NextResponse.json({ error: 'Tên món không được để trống' }, { status: 400 });
    }

    const newId = await saveMenuItem(item, recipes, currentUser);
    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    console.error('Error saving menu item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
