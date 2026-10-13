import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db';

export async function GET() {
  try {
    const rows = await executeQuery<any>(
      `SELECT TOP 1 * FROM PosPaymentSettings WHERE IsActive = 1 ORDER BY Id DESC`
    );

    if (rows.length === 0) {
      // Default fallback
      return NextResponse.json({
        BankBin: '970422',
        BankName: 'MBBank',
        AccountNumber: '0988123456',
        AccountHolder: 'TIEM BANH CHUM CHUM',
        QrPrefix: 'CCB',
      });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy cấu hình thanh toán' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { BankBin, BankName, AccountNumber, AccountHolder, QrPrefix, WebhookSecret } = body;

    const existing = await executeQuery<any>(`SELECT TOP 1 Id FROM PosPaymentSettings ORDER BY Id DESC`);

    if (existing.length > 0) {
      await executeNonQuery(`
        UPDATE PosPaymentSettings SET
          BankBin = '${BankBin || '970422'}',
          BankName = N'${BankName || 'MBBank'}',
          AccountNumber = '${AccountNumber}',
          AccountHolder = N'${AccountHolder}',
          QrPrefix = '${QrPrefix || 'CCB'}',
          WebhookSecret = ${WebhookSecret ? `'${WebhookSecret}'` : 'NULL'},
          UpdatedAt = GETDATE()
        WHERE Id = ${existing[0].Id}
      `);
    } else {
      await executeNonQuery(`
        INSERT INTO PosPaymentSettings (BankBin, BankName, AccountNumber, AccountHolder, QrPrefix, WebhookSecret)
        VALUES ('${BankBin}', N'${BankName}', '${AccountNumber}', N'${AccountHolder}', '${QrPrefix}', ${WebhookSecret ? `'${WebhookSecret}'` : 'NULL'})
      `);
    }

    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình tài khoản VietQR' });
  } catch (error: any) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lưu cấu hình thanh toán' }, { status: 500 });
  }
}
