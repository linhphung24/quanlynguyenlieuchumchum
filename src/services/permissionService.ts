import { executeQuery, executeNonQuery, sql } from '@/lib/db';
import { RolePermission } from '@/types';
import { logAudit } from '@/lib/audit';

export async function getAllRolePermissions(): Promise<RolePermission[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM RolePermissions ORDER BY Role, FeatureKey'
  );

  return rows.map((r) => ({
    Id: Number(r.Id),
    Role: r.Role || '',
    FeatureKey: r.FeatureKey || '',
    FeatureName: r.FeatureName || '',
    CanView: Boolean(r.CanView),
    CanCreate: Boolean(r.CanCreate),
    CanEdit: Boolean(r.CanEdit),
    CanDelete: Boolean(r.CanDelete),
  }));
}

export async function getPermissionsByRole(role: string): Promise<Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>> {
  const rows = await executeQuery<any>(
    'SELECT * FROM RolePermissions WHERE Role = @Role',
    { Role: { type: sql.NVarChar(20), value: role } }
  );

  const result: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
  for (const r of rows) {
    result[r.FeatureKey] = {
      canView: Boolean(r.CanView),
      canCreate: Boolean(r.CanCreate),
      canEdit: Boolean(r.CanEdit),
      canDelete: Boolean(r.CanDelete),
    };
  }
  return result;
}

export async function saveRolePermissions(
  permissions: RolePermission[],
  currentUser: string = 'system'
): Promise<void> {
  const sqlUpdate = `
    UPDATE RolePermissions
    SET CanView = @CanView, CanCreate = @CanCreate, CanEdit = @CanEdit, CanDelete = @CanDelete
    WHERE Id = @Id
  `;

  for (const p of permissions) {
    await executeNonQuery(sqlUpdate, {
      CanView: { type: sql.Bit, value: p.CanView ? 1 : 0 },
      CanCreate: { type: sql.Bit, value: p.CanCreate ? 1 : 0 },
      CanEdit: { type: sql.Bit, value: p.CanEdit ? 1 : 0 },
      CanDelete: { type: sql.Bit, value: p.CanDelete ? 1 : 0 },
      Id: { type: sql.Int, value: p.Id },
    });
  }

  await logAudit(
    currentUser,
    currentUser,
    'UPDATE_PERMISSIONS',
    'RolePermissions',
    'matrix',
    'Cập nhật ma trận phân quyền hệ thống'
  );
}
