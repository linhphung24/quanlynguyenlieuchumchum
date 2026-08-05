using System;
using System.Data;
using ChumChumBakery.Core.Data;
using ChumChumBakery.Core.Models;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class UserService
    {
        public User? Authenticate(string username, string password)
        {
            string sql = "SELECT * FROM Users WHERE Username = @Username AND PasswordHash = @Password";
            var pUser = new SqlParameter("@Username", username);
            // In reality, this should hash the password. Since this is just a mockup with plain passwords in DB from seed:
            var pPass = new SqlParameter("@Password", password);

            var dt = DatabaseHelper.ExecuteQuery(sql, pUser, pPass);
            if (dt.Rows.Count > 0)
            {
                var row = dt.Rows[0];
                return new User
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Username = row["Username"].ToString() ?? "",
                    FullName = row["FullName"].ToString() ?? "",
                    Role = row["Role"].ToString() ?? "staff"
                };
            }
            return null;
        }

        public List<User> GetAllUsers()
        {
            var result = new List<User>();
            string sql = "SELECT * FROM Users";
            var dt = DatabaseHelper.ExecuteQuery(sql);
            foreach (DataRow row in dt.Rows)
            {
                result.Add(new User
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Username = row["Username"].ToString() ?? "",
                    FullName = row["FullName"].ToString() ?? "",
                    Role = row["Role"].ToString() ?? "staff",
                    CreatedBy = row["CreatedBy"] != DBNull.Value ? row["CreatedBy"]?.ToString() ?? "" : "",
                    UpdatedBy = row["UpdatedBy"] != DBNull.Value ? row["UpdatedBy"]?.ToString() ?? "" : ""
                });
            }
            return result;
        }

        public void SaveUser(User user, string plainPassword = "")
        {
            string currentUser = Session.CurrentUser?.Username ?? "system";
            if (user.Id == 0)
            {
                string sql = "INSERT INTO Users (Username, PasswordHash, FullName, Role, CreatedBy, CreatedAt) VALUES (@User, @Pass, @FullName, @Role, @CreatedBy, GETDATE())";
                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@User", user.Username),
                    new SqlParameter("@Pass", plainPassword), // Mocking hash with plain
                    new SqlParameter("@FullName", user.FullName),
                    new SqlParameter("@Role", user.Role),
                    new SqlParameter("@CreatedBy", currentUser)
                );
            }
            else
            {
                if (string.IsNullOrEmpty(plainPassword))
                {
                    string sql = "UPDATE Users SET Username = @User, FullName = @FullName, Role = @Role, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id";
                    DatabaseHelper.ExecuteNonQuery(sql,
                        new SqlParameter("@Id", user.Id),
                        new SqlParameter("@User", user.Username),
                        new SqlParameter("@FullName", user.FullName),
                        new SqlParameter("@Role", user.Role),
                        new SqlParameter("@UpdatedBy", currentUser)
                    );
                }
                else
                {
                    string sql = "UPDATE Users SET Username = @User, PasswordHash = @Pass, FullName = @FullName, Role = @Role, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE Id = @Id";
                    DatabaseHelper.ExecuteNonQuery(sql,
                        new SqlParameter("@Id", user.Id),
                        new SqlParameter("@User", user.Username),
                        new SqlParameter("@Pass", plainPassword),
                        new SqlParameter("@FullName", user.FullName),
                        new SqlParameter("@Role", user.Role),
                        new SqlParameter("@UpdatedBy", currentUser)
                    );
                }
            }
        }

        public void DeleteUser(int id)
        {
            string sql = "DELETE FROM Users WHERE Id = @Id";
            DatabaseHelper.ExecuteNonQuery(sql, new SqlParameter("@Id", id));
        }
    }
}
