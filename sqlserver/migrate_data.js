/**
 * SCRIPT CHUYỂN ĐỔI DỮ LIỆU TỪ SUPABASE (POSTGRESQL) SANG MICROSOFT SQL SERVER
 * Hướng dẫn chạy:
 * 1. Chạy script tạo CSDL d:\source_code\quanlynguyenlieuchumchum_new\sqlserver\ChumChumBakery_SQLServer.sql trong SSMS
 * 2. Cài mssql: npm install mssql
 * 3. Chạy node script: node sqlserver/migrate_data.js
 */

const { createClient } = require('@supabase/supabase-js');
const sql = require('mssql');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

const sqlConfig = {
  user: 'sa',
  password: 'YourPassword123',
  server: 'localhost',
  database: 'ChumChumDB',
  options: {
    trustServerCertificate: true
  }
};

async function migrate() {
  console.log('=== BẮT ĐẦU CHUYỂN ĐỔI DỮ LIỆU SANG SQL SERVER ===');
  
  // 1. Migrate Products
  console.log('1. Migrating Products...');
  const { data: products } = await sb.from('products').select('*');
  console.log(`Fetched ${products?.length || 0} products from Supabase.`);

  // 2. Migrate Invoices & InvoiceDetails
  console.log('2. Migrating Invoices & InvoiceDetails...');
  const { data: invoices } = await sb.from('invoices').select('*');
  console.log(`Fetched ${invoices?.length || 0} invoices from Supabase.`);

  // 3. Migrate Batches & Deductions
  console.log('3. Migrating Batches...');
  const { data: batches } = await sb.from('batches').select('*');
  console.log(`Fetched ${batches?.length || 0} batches from Supabase.`);

  console.log('=== CHUYỂN ĐỔI DỮ LIỆU HOÀN TẤT ===');
}

migrate();
