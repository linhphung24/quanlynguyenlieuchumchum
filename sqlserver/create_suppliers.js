const sql = require('mssql');

const config = {
    user: 'sa',
    password: '1',
    server: '.\\SQLEXPRESS',
    database: 'ChumChumDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createTable() {
    try {
        await sql.connect(config);
        console.log("Connected to SQL Server.");
        
        const query = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Suppliers' and xtype='U')
        BEGIN
            CREATE TABLE Suppliers (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Name NVARCHAR(255) NOT NULL,
                Phone NVARCHAR(50) NULL,
                Address NVARCHAR(255) NULL,
                Note NVARCHAR(500) NULL,
                IsActive BIT DEFAULT 1
            );
            PRINT 'Created Suppliers table.';
        END
        ELSE
        BEGIN
            PRINT 'Suppliers table already exists.';
        END
        `;
        
        await sql.query(query);
        console.log("Migration finished.");
        sql.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

createTable();
