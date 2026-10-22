import http from 'http';
import { createApp } from './app.js';
import { initSocketServer } from './events/socket.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const httpServer = http.createServer(app);

initSocketServer(httpServer);

const server = httpServer.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`  HMS Hospital Management System Backend on port ${env.PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Health: http://localhost:${env.PORT}/health`);
  console.log(`=======================================================`);
});

async function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP and Socket server closed.');
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

