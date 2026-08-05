using System;
using System.Data;
using System.Data.SqlClient;

namespace ChumChumBakery.Core.Data
{
    public static class DatabaseHelper
    {
        public static string ConnectionString { get; set; } = 
            "Server=localhost;Database=ChumChumDB;Trusted_Connection=True;TrustServerCertificate=True;";

        public static SqlConnection GetConnection()
        {
            var conn = new SqlConnection(ConnectionString);
            if (conn.State != ConnectionState.Open)
                conn.Open();
            return conn;
        }

        public static DataTable ExecuteQuery(string sql, params SqlParameter[] parameters)
        {
            using var conn = GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null)
                cmd.Parameters.AddRange(parameters);

            using var adapter = new SqlDataAdapter(cmd);
            var dt = new DataTable();
            adapter.Fill(dt);
            return dt;
        }

        public static int ExecuteNonQuery(string sql, params SqlParameter[] parameters)
        {
            using var conn = GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null)
                cmd.Parameters.AddRange(parameters);

            return cmd.ExecuteNonQuery();
        }

        public static object? ExecuteScalar(string sql, params SqlParameter[] parameters)
        {
            using var conn = GetConnection();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null)
                cmd.Parameters.AddRange(parameters);

            return cmd.ExecuteScalar();
        }
    }
}
