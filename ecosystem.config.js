module.exports = {
  apps: [
    {
      name: 'chumchum-warehouse-web',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3005,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production',
      },
    },
  ],
};
