using System;
using ChumChumBakery.Core.Data;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Services
{
    public class AuditLogService
    {
        public static void LogAction(string action, string entity, string entityId, string detail, SqlTransaction? tx = null)
        {
            var user = Session.CurrentUser;
            string userId = user != null ? user.Id.ToString() : "0";
            string userName = user != null ? user.Username : "System";

            string sql = @"INSERT INTO AuditLog (UserId, UserName, Action, Entity, EntityId, Detail, CreatedAt)
                           VALUES (@UserId, @UserName, @Action, @Entity, @EntityId, @Detail, GETDATE())";

            SqlCommand cmd = null;
            SqlConnection conn = null;

            try
            {
                if (tx != null)
                {
                    cmd = new SqlCommand(sql, tx.Connection, tx);
                }
                else
                {
                    conn = new SqlConnection(DatabaseHelper.ConnectionString);
                    conn.Open();
                    cmd = new SqlCommand(sql, conn);
                }

                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@UserName", userName);
                cmd.Parameters.AddWithValue("@Action", action);
                cmd.Parameters.AddWithValue("@Entity", entity);
                cmd.Parameters.AddWithValue("@EntityId", entityId);
                cmd.Parameters.AddWithValue("@Detail", detail);

                cmd.ExecuteNonQuery();
            }
            finally
            {
                if (tx == null)
                {
                    cmd?.Dispose();
                    conn?.Dispose();
                }
            }
        }
    }
}
