import { executeQuery, executeNonQuery, executeScalar, sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export interface AccountingPeriod {
  Id: number;
  Year: number;
  Month: number;
  IsLocked: boolean;
  LockedBy?: string;
  LockedAt?: string;
  Note?: string;
}

let tableChecked = false;

export async function ensurePeriodsTable(): Promise<void> {
  if (tableChecked) return;
  const createSql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AccountingPeriods' and xtype='U')
    BEGIN
        CREATE TABLE AccountingPeriods (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Year INT NOT NULL,
            Month INT NOT NULL,
            IsLocked BIT NOT NULL DEFAULT 0,
            LockedBy NVARCHAR(100) NULL,
            LockedAt DATETIME NULL,
            Note NVARCHAR(500) NULL,
            CONSTRAINT UQ_AccountingPeriod UNIQUE (Year, Month)
        );
    END
  `;
  try {
    await executeNonQuery(createSql);
    tableChecked = true;
  } catch (err) {
    console.error('ensurePeriodsTable error:', err);
  }
}

export async function getAllAccountingPeriods(): Promise<AccountingPeriod[]> {
  await ensurePeriodsTable();
  const rows = await executeQuery<any>(
    'SELECT * FROM AccountingPeriods ORDER BY Year DESC, Month DESC'
  );

  return rows.map((r) => ({
    Id: Number(r.Id),
    Year: Number(r.Year),
    Month: Number(r.Month),
    IsLocked: Boolean(r.IsLocked),
    LockedBy: r.LockedBy || undefined,
    LockedAt: r.LockedAt ? new Date(r.LockedAt).toISOString() : undefined,
    Note: r.Note || undefined,
  }));
}

export async function getPeriodStatus(
  year: number,
  month: number
): Promise<{ isLocked: boolean; lockedBy?: string; lockedAt?: string; note?: string }> {
  await ensurePeriodsTable();
  const rows = await executeQuery<any>(
    'SELECT * FROM AccountingPeriods WHERE Year = @Year AND Month = @Month',
    {
      Year: { type: sql.Int, value: year },
      Month: { type: sql.Int, value: month },
    }
  );

  if (rows.length === 0) {
    return { isLocked: false };
  }

  const r = rows[0];
  return {
    isLocked: Boolean(r.IsLocked),
    lockedBy: r.LockedBy || undefined,
    lockedAt: r.LockedAt ? new Date(r.LockedAt).toISOString() : undefined,
    note: r.Note || undefined,
  };
}

export async function isDateLocked(dateStr?: string | null): Promise<boolean> {
  if (!dateStr) return false;
  try {
    await ensurePeriodsTable();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const status = await getPeriodStatus(y, m);
    return status.isLocked;
  } catch {
    return false;
  }
}

export async function setPeriodLock(
  year: number,
  month: number,
  isLocked: boolean,
  currentUser: string = 'system',
  note: string = ''
): Promise<void> {
  await ensurePeriodsTable();

  const upsertSql = `
    MERGE AccountingPeriods AS target
    USING (SELECT @Year AS Year, @Month AS Month) AS source
    ON (target.Year = source.Year AND target.Month = source.Month)
    WHEN MATCHED THEN
        UPDATE SET 
            IsLocked = @IsLocked,
            LockedBy = CASE WHEN @IsLocked = 1 THEN @CurrentUser ELSE NULL END,
            LockedAt = CASE WHEN @IsLocked = 1 THEN GETDATE() ELSE NULL END,
            Note = @Note
    WHEN NOT MATCHED THEN
        INSERT (Year, Month, IsLocked, LockedBy, LockedAt, Note)
        VALUES (@Year, @Month, @IsLocked, 
                CASE WHEN @IsLocked = 1 THEN @CurrentUser ELSE NULL END,
                CASE WHEN @IsLocked = 1 THEN GETDATE() ELSE NULL END,
                @Note);
  `;

  await executeNonQuery(upsertSql, {
    Year: { type: sql.Int, value: year },
    Month: { type: sql.Int, value: month },
    IsLocked: { type: sql.Bit, value: isLocked ? 1 : 0 },
    CurrentUser: { type: sql.NVarChar(100), value: currentUser },
    Note: { type: sql.NVarChar(500), value: note || '' },
  });

  await logAudit(
    currentUser,
    currentUser,
    isLocked ? 'LOCK_PERIOD' : 'UNLOCK_PERIOD',
    'AccountingPeriods',
    `${year}-${month}`,
    `${isLocked ? 'Khóa sổ' : 'Mở khóa sổ'} kỳ kế toán Tháng ${month}/${year}`
  );
}
