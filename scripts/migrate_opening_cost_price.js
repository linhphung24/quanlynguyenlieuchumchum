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
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'StockOpeningAdj' AND COLUMN_NAME = 'CostPrice'
    )
    BEGIN
      ALTER TABLE StockOpeningAdj ADD CostPrice DECIMAL(18, 2) NULL;
      PRINT 'Added CostPrice column to StockOpeningAdj';
    END
    ELSE
    BEGIN
      PRINT 'CostPrice column already exists in StockOpeningAdj';
    END
  `);
  console.log('Migration completed successfully.');
  await pool.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
