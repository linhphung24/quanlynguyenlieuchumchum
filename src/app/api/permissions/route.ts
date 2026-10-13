import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRolePermissions,
  saveRolePermissions,
} from '@/services/permissionService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET() {
  try {
    const permissions = await getAllRolePermissions();
    return NextResponse.json({ permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { permissions } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    await saveRolePermissions(permissions, currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
