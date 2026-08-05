using System;
using ChumChumBakery.Core.Data;

namespace WipeDb
{
    internal class Program
    {
        static void Main(string[] args)
        {
            try
            {
                DatabaseHelper.ConnectionString = "Server=.\\SQLEXPRESS;Database=ChumChumDB;Trusted_Connection=True;TrustServerCertificate=True;";
                Console.WriteLine($"ConnectionString: {DatabaseHelper.ConnectionString}");

                string sql = @"
                    DELETE FROM BatchDeductions;
                    DELETE FROM Batches;
                    DELETE FROM InvoiceDetails;
                    DELETE FROM Invoices;
                    DBCC CHECKIDENT ('Invoices', RESEED, 0);
                    DBCC CHECKIDENT ('InvoiceDetails', RESEED, 0);
                    DBCC CHECKIDENT ('Batches', RESEED, 0);
                    DBCC CHECKIDENT ('BatchDeductions', RESEED, 0);
                ";

                int rows = DatabaseHelper.ExecuteNonQuery(sql);
                Console.WriteLine($"SUCCESSFULLY WIPED ALL INVOICES AND BATCHES! Rows affected: {rows}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
