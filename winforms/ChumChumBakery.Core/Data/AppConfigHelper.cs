using System;
using System.IO;
using System.Text.Json;

namespace ChumChumBakery.Core.Data
{
    public class DbConfig
    {
        public string Server { get; set; } = "localhost";
        public string Database { get; set; } = "ChumChumDB";
        public string Username { get; set; } = "sa";
        public string Password { get; set; } = "admin123";
        public bool IntegratedSecurity { get; set; } = true;
    }

    public static class AppConfigHelper
    {
        private static readonly string ConfigPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "connection.json");

        public static DbConfig LoadConfig()
        {
            try
            {
                if (File.Exists(ConfigPath))
                {
                    var json = File.ReadAllText(ConfigPath);
                    var config = JsonSerializer.Deserialize<DbConfig>(json);
                    if (config != null) return config;
                }
            }
            catch { }

            return new DbConfig();
        }

        public static void SaveConfig(DbConfig config)
        {
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.ReadAllText(ConfigPath);
            File.WriteAllText(ConfigPath, json);
            ApplyConnectionString(config);
        }

        public static string BuildConnectionString(DbConfig config)
        {
            if (config.IntegratedSecurity)
            {
                return $"Server={config.Server};Database={config.Database};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=8;";
            }
            else
            {
                return $"Server={config.Server};Database={config.Database};User Id={config.Username};Password={config.Password};TrustServerCertificate=True;Connection Timeout=8;";
            }
        }

        public static void ApplyConnectionString(DbConfig config)
        {
            DatabaseHelper.ConnectionString = BuildConnectionString(config);
        }
    }
}
