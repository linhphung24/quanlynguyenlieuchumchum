import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/services/userService';
import { getPermissionsByRole } from '@/services/permissionService';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, { status: 400 });
    }

    const user = await authenticate(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const permissions = await getPermissionsByRole(user.Role);

    return NextResponse.json({
      user,
      permissions,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống khi đăng nhập.' }, { status: 500 });
  }
}
