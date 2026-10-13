import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { AuditLogItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit')) || 100;
    const rows = await executeQuery<any>(
      `SELECT TOP (@Limit) * FROM AuditLog ORDER BY CreatedAt DESC, Id DESC`,
      { Limit: { type: sql.Int, value: limit } }
    );

    const logs: AuditLogItem[] = rows.map((r) => ({
      Id: Number(r.Id),
      UserId: r.UserId || '',
      UserName: r.UserName || '',
      Action: r.Action || '',
      Entity: r.Entity || '',
      EntityId: r.EntityId || '',
      Detail: r.Detail || '',
      CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : '',
    }));

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
