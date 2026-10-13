import { NextRequest, NextResponse } from 'next/server';
import { getPermissionsByRole } from '@/services/permissionService';

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  if (!role) {
    return NextResponse.json({ error: 'Role required' }, { status: 400 });
  }

  try {
    const permissions = await getPermissionsByRole(role);
    return NextResponse.json({ permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
