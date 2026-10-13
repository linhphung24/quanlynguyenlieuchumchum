import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || 'ChumChumDB',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT !== 'false',
    trustServerCertificate: true,
    connectTimeout: 15000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(sqlConfig)
      .connect()
      .then((pool) => {
        return pool;
      })
      .catch((err) => {
        poolPromise = null;
        console.error('MSSQL Connection Error:', err);
        throw err;
      });
  }
  return poolPromise;
}

export async function executeQuery<T = any>(
  queryText: string,
  params?: Record<string, { type?: any; value: any }>
): Promise<T[]> {
  const pool = await getDbPool();
  const request = pool.request();

  if (params) {
    for (const [key, p] of Object.entries(params)) {
      if (p.type) {
        request.input(key, p.type, p.value);
      } else {
        request.input(key, p.value);
      }
    }
  }

  const result = await request.query(queryText);
  return result.recordset as T[];
}

export async function executeScalar<T = any>(
  queryText: string,
  params?: Record<string, { type?: any; value: any }>
): Promise<T | null> {
  const records = await executeQuery<any>(queryText, params);
  if (!records || records.length === 0) return null;
  const firstRow = records[0];
  const firstKey = Object.keys(firstRow)[0];
  return firstKey !== undefined ? (firstRow[firstKey] as T) : null;
}

export async function executeNonQuery(
  queryText: string,
  params?: Record<string, { type?: any; value: any }>
): Promise<number> {
  const pool = await getDbPool();
  const request = pool.request();

  if (params) {
    for (const [key, p] of Object.entries(params)) {
      if (p.type) {
        request.input(key, p.type, p.value);
      } else {
        request.input(key, p.value);
      }
    }
  }

  const result = await request.query(queryText);
  return result.rowsAffected.reduce((a, b) => a + b, 0);
}

export { sql };
