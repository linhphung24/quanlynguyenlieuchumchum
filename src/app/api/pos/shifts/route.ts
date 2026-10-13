import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery, executeScalar } from '@/lib/db';

export async function GET() {
  try {
    // Get active open shift
    const openShifts = await executeQuery<any>(
      `SELECT TOP 1 * FROM PosShifts WHERE Status = 'open' ORDER BY Id DESC`
    );

    if (openShifts.length === 0) {
      return NextResponse.json({ activeShift: null });
    }

    const shift = openShifts[0];

    // Recalculate live totals from completed orders in this shift
    const orderStats = await executeQuery<any>(`
      SELECT 
        COUNT(CASE WHEN OrderStatus = 'completed' THEN 1 END) as TotalOrders,
        ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod = 'cash' THEN FinalAmount ELSE 0 END), 0) as CashSales,
        ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod = 'qr_transfer' THEN FinalAmount ELSE 0 END), 0) as QRSales,
        ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod NOT IN ('cash', 'qr_transfer') THEN FinalAmount ELSE 0 END), 0) as OtherSales,
        ISNULL(SUM(CASE WHEN OrderStatus = 'completed' THEN FinalAmount ELSE 0 END), 0) as TotalSales
      FROM PosOrders
      WHERE ShiftId = ${shift.Id}
    `);

    const stats = orderStats[0] || {
      TotalOrders: 0,
      CashSales: 0,
      QRSales: 0,
      OtherSales: 0,
      TotalSales: 0,
    };

    return NextResponse.json({
      activeShift: {
        ...shift,
        TotalOrders: stats.TotalOrders,
        LiveCashSales: stats.CashSales,
        LiveQRSales: stats.QRSales,
        LiveTotalSales: stats.TotalSales,
        ExpectedCash: shift.OpeningCash + stats.CashSales + shift.TotalPaidIn - shift.TotalPaidOut,
      },
    });
  } catch (error: any) {
    console.error('Error getting shift status:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lấy thông tin ca bán hàng' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, openingCash = 0, closingCashActual = 0, cashierId = 1, cashierName = 'Thu ngân', notes = '' } = body;

    if (action === 'open') {
      // Check if already an open shift
      const existing = await executeQuery<any>(
        `SELECT TOP 1 * FROM PosShifts WHERE Status = 'open' ORDER BY Id DESC`
      );
      if (existing.length > 0) {
        return NextResponse.json({
          error: 'Hiện đang có một ca đang mở. Vui lòng chốt ca cũ trước khi mở ca mới.',
        }, { status: 400 });
      }

      // Generate ShiftCode: SHIFT-YYYYMMDD-XX
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const prefix = `SHIFT-${yyyy}${mm}${dd}`;

      const countToday = await executeScalar<number>(
        `SELECT COUNT(*) FROM PosShifts WHERE ShiftCode LIKE '${prefix}%'`
      );
      const seq = String((countToday || 0) + 1).padStart(2, '0');
      const shiftCode = `${prefix}-${seq}`;

      await executeNonQuery(`
        INSERT INTO PosShifts (
          ShiftCode, CashierId, CashierName, OpenedAt, OpeningCash,
          TotalCashSales, TotalQRSales, TotalOtherSales, TotalPaidIn, TotalPaidOut,
          Status, Notes
        )
        VALUES (
          '${shiftCode}', ${cashierId}, N'${cashierName}', GETDATE(), ${openingCash},
          0, 0, 0, 0, 0,
          'open', N'${notes.replace(/'/g, "''")}'
        )
      `);

      const newShift = await executeQuery<any>(
        `SELECT TOP 1 * FROM PosShifts WHERE ShiftCode = '${shiftCode}'`
      );

      return NextResponse.json({
        success: true,
        message: 'Mở ca bán hàng thành công!',
        shift: newShift[0],
      });
    }

    if (action === 'close') {
      const openShifts = await executeQuery<any>(
        `SELECT TOP 1 * FROM PosShifts WHERE Status = 'open' ORDER BY Id DESC`
      );
      if (openShifts.length === 0) {
        return NextResponse.json({ error: 'Không có ca bán hàng nào đang mở' }, { status: 400 });
      }

      const shift = openShifts[0];

      // Calculate totals from orders
      const orderStats = await executeQuery<any>(`
        SELECT 
          ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod = 'cash' THEN FinalAmount ELSE 0 END), 0) as CashSales,
          ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod = 'qr_transfer' THEN FinalAmount ELSE 0 END), 0) as QRSales,
          ISNULL(SUM(CASE WHEN OrderStatus = 'completed' AND PaymentMethod NOT IN ('cash', 'qr_transfer') THEN FinalAmount ELSE 0 END), 0) as OtherSales
        FROM PosOrders
        WHERE ShiftId = ${shift.Id}
      `);

      const cashSales = orderStats[0]?.CashSales || 0;
      const qrSales = orderStats[0]?.QRSales || 0;
      const otherSales = orderStats[0]?.OtherSales || 0;

      const expectedCash = shift.OpeningCash + cashSales + shift.TotalPaidIn - shift.TotalPaidOut;
      const difference = closingCashActual - expectedCash;

      await executeNonQuery(`
        UPDATE PosShifts SET
          ClosedAt = GETDATE(),
          ClosingCashActual = ${closingCashActual},
          TotalCashSales = ${cashSales},
          TotalQRSales = ${qrSales},
          TotalOtherSales = ${otherSales},
          CashDifference = ${difference},
          Status = 'closed',
          Notes = N'${notes.replace(/'/g, "''")}'
        WHERE Id = ${shift.Id}
      `);

      // Optionally create accounting cash voucher for the shift sales if cashSales > 0
      if (cashSales > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const vCode = `PT-POS-${shift.Id}`;
        const existingVoucher = await executeQuery<any>(
          `SELECT Id FROM CashVouchers WHERE Code = '${vCode}'`
        );
        if (existingVoucher.length === 0) {
          try {
            await executeNonQuery(`
              INSERT INTO CashVouchers (
                Type, VoucherDate, Code, Partner, Receiver, Reason, Amount, PaymentMethod, Note, CreatedBy, CreatedAt
              )
              VALUES (
                'thu', '${todayStr}', '${vCode}', N'Khách lẻ POS', N'${shift.CashierName}',
                N'Doanh thu tiền mặt ca bán hàng ${shift.ShiftCode}', ${cashSales}, N'Tiền mặt',
                N'Tự động ghi nhận từ Phân hệ POS', N'Hệ thống POS', GETDATE()
              )
            `);
          } catch (vErr) {
            console.error('Auto cash voucher insert warning:', vErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Chốt ca bán hàng thành công!',
        shiftId: shift.Id,
        cashDifference: difference,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling shift action:', error);
    return NextResponse.json({ error: error.message || 'Lỗi thao tác ca bán hàng' }, { status: 500 });
  }
}
