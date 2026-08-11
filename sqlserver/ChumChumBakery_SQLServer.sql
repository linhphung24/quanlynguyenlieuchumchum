-- ============================================================================
-- CHUM CHUM BAKERY - DATABASE SCHEMA (MICROSOFT SQL SERVER)
-- Database Name: ChumChumDB
-- Created Date : 2026-07-31
-- Description  : CSDL Quản lý Kho & Nguyên liệu cho tiệm bánh Chum Chum Bakery
--                (Tối ưu hoá cho ứng dụng C# WinForms)
-- ============================================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'ChumChumDB')
BEGIN
    ALTER DATABASE ChumChumDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ChumChumDB;
END
GO

CREATE DATABASE ChumChumDB;
GO

USE ChumChumDB;
GO

-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG & PHÂN QUYỀN (Users)
-- ============================================================================
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (Role IN ('admin', 'manager', 'staff', 'ketoan', 'thukho')),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 2. BẢNG SẢN PHẨM / NGUYÊN LIỆU / VẬT LIỆU (Products)
-- ============================================================================
CREATE TABLE Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NULL,
    Name NVARCHAR(255) NOT NULL UNIQUE,
    Category NVARCHAR(100) NOT NULL DEFAULT N'Nguyên liệu',
    Unit NVARCHAR(20) NOT NULL DEFAULT N'kg',
    CostPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    SellPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    StockQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    MinStock DECIMAL(18,2) NOT NULL DEFAULT 0,
    Supplier NVARCHAR(255) NOT NULL DEFAULT '',
    Description NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
    UpdatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

CREATE INDEX IX_Products_Name ON Products(Name);
CREATE INDEX IX_Products_Category ON Products(Category);
GO

-- ============================================================================
-- 3. BẢNG HOÁ ĐƠN NHẬP / XUẤT (Invoices)
-- ============================================================================
CREATE TABLE Invoices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Type NVARCHAR(10) NOT NULL CHECK (Type IN ('in', 'out')),
    InvDate DATE NOT NULL,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Partner NVARCHAR(255) NOT NULL DEFAULT '',
    Note NVARCHAR(MAX) NULL,
    ImageUrl NVARCHAR(500) NULL,
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
    UpdatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

CREATE INDEX IX_Invoices_InvDate ON Invoices(InvDate);
CREATE INDEX IX_Invoices_Type ON Invoices(Type);
GO

-- ============================================================================
-- 4. BẢNG CHI TIẾT HOÁ ĐƠN (InvoiceDetails) - Chuẩn hoá thay JSONB
-- ============================================================================
CREATE TABLE InvoiceDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId INT NOT NULL FOREIGN KEY REFERENCES Invoices(Id) ON DELETE CASCADE,
    ProductId INT NULL FOREIGN KEY REFERENCES Products(Id),
    ProductName NVARCHAR(255) NOT NULL,
    Unit NVARCHAR(20) NOT NULL DEFAULT N'kg',
    Amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Price DECIMAL(18,2) NOT NULL DEFAULT 0,
    Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    MfgDate DATE NULL,
    ExpDate DATE NULL
);
GO

CREATE INDEX IX_InvoiceDetails_InvoiceId ON InvoiceDetails(InvoiceId);
CREATE INDEX IX_InvoiceDetails_ProductName ON InvoiceDetails(ProductName);
GO

-- ============================================================================
-- 5. BẢNG LÔ HÀNG - FIFO BATCH TRACKING (Batches)
-- ============================================================================
CREATE TABLE Batches (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    InvoiceId INT NOT NULL FOREIGN KEY REFERENCES Invoices(Id),
    InvoiceCode NVARCHAR(50) NOT NULL,
    InvoiceDate DATE NOT NULL,
    Quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
    RemainingQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    Price DECIMAL(18,2) NOT NULL DEFAULT 0,
    Unit NVARCHAR(20) NOT NULL DEFAULT N'kg',
    MfgDate DATE NULL,
    ExpDate DATE NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Batches_ProductName ON Batches(ProductName);
CREATE INDEX IX_Batches_RemainingQty ON Batches(RemainingQty);
CREATE INDEX IX_Batches_InvoiceDate ON Batches(InvoiceDate);
GO

-- ============================================================================
-- 6. BẢNG GHI NHẬN TRỪ LÔ - FIFO DEDUCTIONS (BatchDeductions)
-- ============================================================================
CREATE TABLE BatchDeductions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BatchId INT NOT NULL FOREIGN KEY REFERENCES Batches(Id),
    InvoiceId INT NOT NULL FOREIGN KEY REFERENCES Invoices(Id),
    QtyUsed DECIMAL(18,2) NOT NULL DEFAULT 0,
    BatchInvCode NVARCHAR(50) NOT NULL,
    BatchInvDate DATE NOT NULL,
    BatchPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    BatchUnit NVARCHAR(20) NOT NULL DEFAULT N'kg',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_BatchDeductions_BatchId ON BatchDeductions(BatchId);
CREATE INDEX IX_BatchDeductions_InvoiceId ON BatchDeductions(InvoiceId);
GO

-- ============================================================================
-- 7. BẢNG CHỐT TỒN KIỂM KHO ĐẦU KỲ (StockOpeningAdj)
-- ============================================================================
CREATE TABLE StockOpeningAdj (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    Year INT NOT NULL,
    Month INT NOT NULL,
    AdjQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    UpdatedBy NVARCHAR(100) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_StockOpeningAdj UNIQUE (ProductName, Year, Month)
);
GO

-- ============================================================================
-- 8. BẢNG CÔNG THỨC BÁNH (Recipes)
-- ============================================================================
CREATE TABLE Recipes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL UNIQUE,
    BaseYield DECIMAL(18,2) NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
    UpdatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

-- ============================================================================
-- 9. BẢNG CHI TIẾT NGUYÊN LIỆU CÔNG THỨC (RecipeIngredients)
-- ============================================================================
CREATE TABLE RecipeIngredients (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RecipeId INT NOT NULL FOREIGN KEY REFERENCES Recipes(Id) ON DELETE CASCADE,
    ProductName NVARCHAR(255) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Unit NVARCHAR(20) NOT NULL DEFAULT N'g',
    Price DECIMAL(18,2) NOT NULL DEFAULT 0
);
GO

CREATE INDEX IX_RecipeIngredients_RecipeId ON RecipeIngredients(RecipeId);
GO

-- ============================================================================
-- 10. BẢNG NHẬT KÝ SẢN XUẤT HÀNG NGÀY (DailyLog)
-- ============================================================================
CREATE TABLE DailyLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LogDate DATE NOT NULL,
    RecipeId INT NOT NULL FOREIGN KEY REFERENCES Recipes(Id),
    Qty DECIMAL(18,2) NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 11. BẢNG QUẢN LÝ NHÂN SỰ (Personnel)
-- ============================================================================
CREATE TABLE Personnel (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Dob DATE NOT NULL,
    Position NVARCHAR(100) NULL,
    Department NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    Notes NVARCHAR(MAX) NULL,
    CreatedBy NVARCHAR(100) NOT NULL DEFAULT '',
    UpdatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

-- ============================================================================
-- 12. BẢNG NHẬT KÝ THAO TÁC HỆ THỐNG (AuditLog)
-- ============================================================================
CREATE TABLE AuditLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(50) NULL,
    UserName NVARCHAR(100) NOT NULL,
    Action NVARCHAR(20) NOT NULL,
    Entity NVARCHAR(50) NOT NULL,
    EntityId NVARCHAR(50) NULL,
    Detail NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- SEED DATA MẶC ĐỊNH
-- ============================================================================

-- Mật khẩu mặc định: admin123 (Hash PBKDF2/SHA256 hoặc Plain Text mã hoá nhẹ)
INSERT INTO Users (Username, PasswordHash, FullName, Role)
VALUES 
(N'admin', N'admin123', N'Quản trị viên', N'admin'),
(N'quanly', N'123456', N'Quản lý Kho', N'manager'),
(N'nhanvien', N'123456', N'Nhân viên Kho', N'staff');
GO

PRINT N'=== TẠO CƠ SỞ DỮ LIỆU ChumChumDB THÀNH CÔNG ===';
GO
