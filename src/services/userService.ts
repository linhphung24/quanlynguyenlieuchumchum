import { executeQuery, executeNonQuery, sql } from '@/lib/db';
import { User } from '@/types';
import { logAudit } from '@/lib/audit';

export async function authenticate(username: string, password: string): Promise<User | null> {
  const rows = await executeQuery<any>(
    'SELECT * FROM Users WHERE Username = @Username AND PasswordHash = @Password',
    {
      Username: { type: sql.NVarChar(50), value: username },
      Password: { type: sql.NVarChar(255), value: password },
    }
  );

  if (rows.length > 0) {
    const r = rows[0];
    return {
      Id: Number(r.Id),
      Username: r.Username || '',
      FullName: r.FullName || '',
      Role: r.Role || 'staff',
      CreatedBy: r.CreatedBy || '',
      UpdatedBy: r.UpdatedBy || '',
      CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
      UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
    };
  }
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await executeQuery<any>('SELECT * FROM Users ORDER BY Id');
  return rows.map((r) => ({
    Id: Number(r.Id),
    Username: r.Username || '',
    FullName: r.FullName || '',
    Role: r.Role || 'staff',
    CreatedBy: r.CreatedBy || '',
    UpdatedBy: r.UpdatedBy || '',
    CreatedAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : undefined,
    UpdatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
  }));
}

export async function saveUser(
  user: Partial<User>,
  plainPassword: string = '',
  currentUser: string = 'system'
): Promise<void> {
  if (!user.Id || user.Id === 0) {
    const sqlInsert = `
      INSERT INTO Users (Username, PasswordHash, FullName, Role, CreatedBy, CreatedAt)
      VALUES (@User, @Pass, @FullName, @Role, @CreatedBy, GETDATE())
    `;

    await executeNonQuery(sqlInsert, {
      User: { type: sql.NVarChar(50), value: user.Username || '' },
      Pass: { type: sql.NVarChar(255), value: plainPassword || '123456' },
      FullName: { type: sql.NVarChar(255), value: user.FullName || '' },
      Role: { type: sql.NVarChar(20), value: user.Role || 'staff' },
      CreatedBy: { type: sql.NVarChar(100), value: currentUser },
    });

    await logAudit(currentUser, currentUser, 'CREATE', 'User', user.Username || '', `Thêm tài khoản: ${user.Username}`);
  } else {
    if (!plainPassword) {
      const sqlUpdate = `
        UPDATE Users SET Username = @User, FullName = @FullName, Role = @Role, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
        WHERE Id = @Id
      `;

      await executeNonQuery(sqlUpdate, {
        User: { type: sql.NVarChar(50), value: user.Username || '' },
        FullName: { type: sql.NVarChar(255), value: user.FullName || '' },
        Role: { type: sql.NVarChar(20), value: user.Role || 'staff' },
        UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
        Id: { type: sql.Int, value: user.Id },
      });
    } else {
      const sqlUpdate = `
        UPDATE Users SET Username = @User, PasswordHash = @Pass, FullName = @FullName, Role = @Role, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
        WHERE Id = @Id
      `;

      await executeNonQuery(sqlUpdate, {
        User: { type: sql.NVarChar(50), value: user.Username || '' },
        Pass: { type: sql.NVarChar(255), value: plainPassword },
        FullName: { type: sql.NVarChar(255), value: user.FullName || '' },
        Role: { type: sql.NVarChar(20), value: user.Role || 'staff' },
        UpdatedBy: { type: sql.NVarChar(100), value: currentUser },
        Id: { type: sql.Int, value: user.Id },
      });
    }

    await logAudit(currentUser, currentUser, 'UPDATE', 'User', String(user.Id), `Sửa tài khoản: ${user.Username}`);
  }
}

export async function deleteUser(id: number, currentUser: string = 'system'): Promise<void> {
  await executeNonQuery('DELETE FROM Users WHERE Id = @Id', {
    Id: { type: sql.Int, value: id },
  });

  await logAudit(currentUser, currentUser, 'DELETE', 'User', String(id), `Xóa tài khoản ID: ${id}`);
}
