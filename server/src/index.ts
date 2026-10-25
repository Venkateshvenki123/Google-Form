import { app } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';

async function bootstrap() {
  try {
    console.log('🔄 Initializing Dynamic Form Builder Backend Server...');
    await runMigrations();
    await seedDatabase();

    const server = app.listen(config.port, () => {
      console.log(`\n==================================================`);
      console.log(`✨ Backend API running successfully on port ${config.port}`);
      console.log(`🌐 API Base URL: http://localhost:${config.port}/api`);
      console.log(`🛡️  Health check: http://localhost:${config.port}/api/health`);
      console.log(`🔑 Default Admin: ${config.adminDefault.email} / ${config.adminDefault.password}`);
      console.log(`==================================================\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down server...');
      server.close(() => {
        console.log('💤 HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
