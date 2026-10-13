import { NextRequest, NextResponse } from 'next/server';
import { getMenuItemById, saveMenuItem, deleteMenuItem, toggleMenuItemActive } from '@/services/menuService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (!id) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const item = await getMenuItemById(id);
    if (!item) return NextResponse.json({ error: 'Không tìm thấy món' }, { status: 404 });

    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (!id) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const body = await req.json();
    const currentUser = getCurrentUser(req, body, 'system');

    // Quick toggle active status
    if (body.toggleActive !== undefined) {
      await toggleMenuItemActive(id, Boolean(body.isActive), currentUser);
      return NextResponse.json({ success: true });
    }

    const { item, recipes = [] } = body;
    if (!item) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    item.Id = id;
    await saveMenuItem(item, recipes, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (!id) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const currentUser = getCurrentUser(req, undefined, 'system');
    await deleteMenuItem(id, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
