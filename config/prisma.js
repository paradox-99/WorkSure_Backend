const { PrismaClient } = require('../generated/prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

// Use singleton pattern to prevent multiple instances
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  // 1. Create a Postgres connection pool with proper limits
  const pool = new Pool({ 
    connectionString: process.env.URL,
    max: 10,              // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000,  // Return an error after 2 seconds if connection could not be established
  });

  // 2. Create the Prisma Adapter
  const adapter = new PrismaPg(pool);

  // 3. Pass the adapter to PrismaClient
  globalForPrisma.prisma = new PrismaClient({ adapter });
  globalForPrisma.pool = pool;
}

const prisma = globalForPrisma.prisma;

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
  process.exit(0);
});

module.exports = prisma;