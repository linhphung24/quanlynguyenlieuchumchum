using System;

namespace ChumChumBakery.Core.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
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
    }

    public class InvoiceDetail
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int? ProductId { get; set; }
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
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal AdjQty { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "staff"; // admin, manager, staff
    }
}
