import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db';

export async function GET() {
  try {
    const rows = await executeQuery<any>(
      `SELECT TOP 1 * FROM PosReceiptTemplates WHERE IsDefault = 1 ORDER BY Id DESC`
    );

    if (rows.length === 0) {
      return NextResponse.json({
        TemplateName: 'Mẫu in chuẩn K80',
        PaperSize: 'k80',
        ShopName: 'CHUM CHUM BAKERY',
        ShopAddress: 'Số 18 Ngõ 120 Trần Cung, Cầu Giấy, Hà Nội',
        ShopPhone: '0988.123.456',
        WifiInfo: 'WiFi: ChumChum_Bakery / Pass: chumchum68',
        HeaderTitle: 'PHIẾU THANH TOÁN',
        FooterMessage: 'Cảm ơn Quý khách & Hẹn gặp lại!',
        ShowLogo: true,
        ShowCashier: true,
        ShowTable: true,
        ShowCustomer: false,
        ShowItemNote: true,
        ShowQrCode: true,
        QrType: 'vietqr',
      });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching receipt template:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy mẫu in hóa đơn' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      TemplateName = 'Mẫu in chuẩn K80',
      PaperSize = 'k80',
      ShopName = 'CHUM CHUM BAKERY',
      ShopAddress = '',
      ShopPhone = '',
      WifiInfo = '',
      HeaderTitle = 'PHIẾU THANH TOÁN',
      FooterMessage = 'Cảm ơn Quý khách & Hẹn gặp lại!',
      ShowLogo = true,
      ShowCashier = true,
      ShowTable = true,
      ShowCustomer = false,
      ShowItemNote = true,
      ShowQrCode = true,
      QrType = 'vietqr',
      CustomQrUrl = '',
    } = body;

    const existing = await executeQuery<any>(`SELECT TOP 1 Id FROM PosReceiptTemplates ORDER BY Id DESC`);

    if (existing.length > 0) {
      await executeNonQuery(`
        UPDATE PosReceiptTemplates SET
          TemplateName = N'${TemplateName.replace(/'/g, "''")}',
          PaperSize = '${PaperSize}',
          ShopName = N'${ShopName.replace(/'/g, "''")}',
          ShopAddress = N'${ShopAddress.replace(/'/g, "''")}',
          ShopPhone = '${ShopPhone.replace(/'/g, "''")}',
          WifiInfo = N'${WifiInfo.replace(/'/g, "''")}',
          HeaderTitle = N'${HeaderTitle.replace(/'/g, "''")}',
          FooterMessage = N'${FooterMessage.replace(/'/g, "''")}',
          ShowLogo = ${ShowLogo ? 1 : 0},
          ShowCashier = ${ShowCashier ? 1 : 0},
          ShowTable = ${ShowTable ? 1 : 0},
          ShowCustomer = ${ShowCustomer ? 1 : 0},
          ShowItemNote = ${ShowItemNote ? 1 : 0},
          ShowQrCode = ${ShowQrCode ? 1 : 0},
          QrType = '${QrType}',
          CustomQrUrl = ${CustomQrUrl ? `'${CustomQrUrl.replace(/'/g, "''")}'` : 'NULL'},
          UpdatedAt = GETDATE()
        WHERE Id = ${existing[0].Id}
      `);
    } else {
      await executeNonQuery(`
        INSERT INTO PosReceiptTemplates (
          TemplateName, PaperSize, ShopName, ShopAddress, ShopPhone, WifiInfo,
          HeaderTitle, FooterMessage, ShowLogo, ShowCashier, ShowTable,
          ShowCustomer, ShowItemNote, ShowQrCode, QrType, CustomQrUrl
        )
        VALUES (
          N'${TemplateName}', '${PaperSize}', N'${ShopName}', N'${ShopAddress}', '${ShopPhone}', N'${WifiInfo}',
          N'${HeaderTitle}', N'${FooterMessage}', ${ShowLogo ? 1 : 0}, ${ShowCashier ? 1 : 0}, ${ShowTable ? 1 : 0},
          ${ShowCustomer ? 1 : 0}, ${ShowItemNote ? 1 : 0}, ${ShowQrCode ? 1 : 0}, '${QrType}', ${CustomQrUrl ? `'${CustomQrUrl}'` : 'NULL'}
        )
      `);
    }

    return NextResponse.json({ success: true, message: 'Đã lưu mẫu thiết kế hóa đơn thành công!' });
  } catch (error: any) {
    console.error('Error updating receipt template:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lưu mẫu in hóa đơn' }, { status: 500 });
  }
}
