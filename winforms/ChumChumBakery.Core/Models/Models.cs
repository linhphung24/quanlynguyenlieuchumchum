using System;

namespace ChumChumBakery.Core.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayCodeAndName => string.IsNullOrEmpty(Code) ? Name : $"{Code} - {Name}";
        public string Category { get; set; } = "Nguyên liệu";
        public string Unit { get; set; } = "kg";
        public decimal CostPrice { get; set; }
        public decimal SellPrice { get; set; }
        public decimal StockQty { get; set; }
        public decimal MinStock { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        
        public override string ToString() => DisplayCodeAndName;
    }

    public class Invoice
    {
        public int Id { get; set; }
        public string Type { get; set; } = "in"; // "in" hoặc "out"
        public DateTime InvDate { get; set; } = DateTime.Today;
        public string Code { get; set; } = string.Empty;
        public string Partner { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        
        // Phục vụ hiển thị trên lưới
        public string TypeDisplay => Type == "in" ? "Nhập kho" : "Xuất kho";
        public decimal TotalAmount { get; set; }
    }

    public class InvoiceDetail
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int? ProductId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Unit { get; set; } = "kg";
        public decimal Amount { get; set; }
        public decimal Price { get; set; }
        public decimal Subtotal => Amount * Price;
        public DateTime? MfgDate { get; set; }
        public DateTime? ExpDate { get; set; }
    }

    public class Batch
    {
        public int Id { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal RemainingQty { get; set; }
        public decimal Price { get; set; }
        public string Unit { get; set; } = "kg";
        public DateTime? MfgDate { get; set; }
        public DateTime? ExpDate { get; set; }
    }

    public class BatchDeduction
    {
        public int Id { get; set; }
        public int BatchId { get; set; }
        public int InvoiceId { get; set; }
        public decimal QtyUsed { get; set; }
        public string BatchInvCode { get; set; } = string.Empty;
        public DateTime BatchInvDate { get; set; }
        public decimal BatchPrice { get; set; }
        public string BatchUnit { get; set; } = "kg";
    }

    public class StockOpeningAdj
    {
        public int Id { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductCode { get; set; } = string.Empty; // Added for UI display
        public string Unit { get; set; } = string.Empty; // Added for UI display
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal AdjQty { get; set; }
        public decimal CurrentStock { get; set; } // Real-time stock for Excel export
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class Recipe
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BaseYield { get; set; } = 1;
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class RecipeIngredient
    {
        public int Id { get; set; }
        public int RecipeId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Unit { get; set; } = "g";
        public decimal Price { get; set; }
        
        // Dùng cho hiển thị trên máy tính định mức
        public decimal RequiredAmount { get; set; } 
    }


    public class AuditLog
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "staff"; // admin, manager, staff
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class Supplier
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class RolePermission
    {
        public int Id { get; set; }
        public string Role { get; set; } = string.Empty;
        public string FeatureKey { get; set; } = string.Empty;
        public string FeatureName { get; set; } = string.Empty;
        public bool CanView { get; set; }
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
    }
}

