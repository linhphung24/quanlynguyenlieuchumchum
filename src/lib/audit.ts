import { executeNonQuery, sql } from './db';

export async function logAudit(
  userId: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  detail: string
): Promise<void> {
  try {
    await executeNonQuery(
      `INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
       VALUES (@UserId, @UserName, @Action, @Entity, @EntityId, @Detail, GETDATE())`,
      {
        UserId: { type: sql.NVarChar(100), value: userId || '' },
        UserName: { type: sql.NVarChar(100), value: userName || '' },
        Action: { type: sql.NVarChar(50), value: action },
        Entity: { type: sql.NVarChar(50), value: entity },
        EntityId: { type: sql.NVarChar(100), value: entityId },
        Detail: { type: sql.NVarChar(sql.MAX), value: detail },
      }
    );
  } catch (err) {
    console.error('AuditLog error:', err);
  }
}
