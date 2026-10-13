const sql = require('mssql');
const config = {
  user: process.env.MSSQL_USER || 'chumchum_app',
  password: process.env.MSSQL_PASSWORD || 'Chumchum123@',
  server: process.env.MSSQL_SERVER || '103.163.214.101',
  database: process.env.MSSQL_DATABASE || 'ChumChumDB',
  options: { encrypt: true, trustServerCertificate: true }
};

async function main() {
  const pool = await sql.connect(config);
  const r = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME IN ('StockOpeningAdj', 'Batches', 'BatchDeductions', 'InvoiceDetails')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  console.log(JSON.stringify(r.recordset, null, 2));
  await pool.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
