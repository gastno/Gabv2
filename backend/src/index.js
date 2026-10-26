const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config();

const { loadConfig } = require('./config/environment');
const config = loadConfig();
process.env.DB_PASSWORD = config.db.password;
process.env.JWT_SECRET = config.jwtSecret;
process.env.DB_POOL_MAX = String(config.db.max);
const database = require('./config/db');
const { createApp } = require('./app');
const { startNotificationWorker } = require('./services/notificationService');
const app = createApp({ database, config });

const start = async () => {
  try {
    await database.query('SELECT 1');
  } catch (error) {
    console.error('API startup failed: database is unavailable.', error.message);
    try {
      await database.end();
    } catch (shutdownError) {
      console.error('Database pool shutdown failed:', shutdownError.message);
    }
    process.exitCode = 1;
    return null;
  }

  const server = app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
  const stopNotificationWorker = startNotificationWorker(database);
  let shuttingDown = false;

  const shutdown = signal => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down.`);
    stopNotificationWorker();

    const forceShutdown = setTimeout(() => {
      console.error('Graceful shutdown timed out.');
      process.exit(1);
    }, 10000);
    forceShutdown.unref();

    server.close(async error => {
      if (error) {
        console.error('HTTP server shutdown failed:', error.message);
        process.exitCode = 1;
      }
      try {
        await database.end();
      } catch (databaseError) {
        console.error('Database pool shutdown failed:', databaseError.message);
        process.exitCode = 1;
      }
      clearTimeout(forceShutdown);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  server.once('error', error => {
    console.error('HTTP server failed:', error.message);
    process.exitCode = 1;
  });
  return server;
};

if (require.main === module) void start();

module.exports = { app, start };
