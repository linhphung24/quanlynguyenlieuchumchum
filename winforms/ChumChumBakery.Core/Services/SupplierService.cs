using System;
using System.Collections.Generic;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class SupplierService
    {
        public List<Supplier> GetAllSuppliers(string keyword = "")
        {
            var result = new List<Supplier>();
            string sql = "SELECT * FROM Suppliers WHERE IsActive = 1 AND (Name LIKE @Keyword OR Phone LIKE @Keyword) ORDER BY Name";
            
            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@Keyword", "%" + keyword + "%"));
            
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new Supplier
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Name = row["Name"]?.ToString() ?? "",
                    Phone = row["Phone"]?.ToString() ?? "",
                    Address = row["Address"]?.ToString() ?? "",
                    Note = row["Note"]?.ToString() ?? "",
                    IsActive = Convert.ToBoolean(row["IsActive"]),
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : ""
                });
            }
            
            return result;
        }

        public void SaveSupplier(Supplier supplier)
        {
            string currentUser = Session.CurrentUser?.Username ?? "system";
            if (supplier.Id == 0)
            {
                string sql = "INSERT INTO Suppliers (Name, Phone, Address, Note, CreatedBy, CreatedAt) VALUES (@Name, @Phone, @Address, @Note, @CreatedBy, GETDATE())";
                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@Name", supplier.Name),
                    new SqlParameter("@Phone", supplier.Phone),
                    new SqlParameter("@Address", supplier.Address),
                    new SqlParameter("@Note", supplier.Note),
                    new SqlParameter("@CreatedBy", currentUser)
                );
            }
            else
            {
                string sql = "UPDATE Suppliers SET Name = @Name, Phone = @Phone, Address = @Address, Note = @Note, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id";
                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@Id", supplier.Id),
                    new SqlParameter("@Name", supplier.Name),
                    new SqlParameter("@Phone", supplier.Phone),
                    new SqlParameter("@Address", supplier.Address),
                    new SqlParameter("@Note", supplier.Note),
                    new SqlParameter("@UpdatedBy", currentUser)
                );
            }
        }

        public void DeleteSupplier(int id)
        {
            string sql = "UPDATE Suppliers SET IsActive = 0 WHERE Id = @Id";
            DatabaseHelper.ExecuteNonQuery(sql, new SqlParameter("@Id", id));
        }
    }
}
