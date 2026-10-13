import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, saveUser, deleteUser } from '@/services/userService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, password } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    await saveUser(user, password, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const currentUser = getCurrentUser(req, undefined, 'system');

    await deleteUser(Number(id), currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
