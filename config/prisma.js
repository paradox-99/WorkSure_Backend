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
    max: 20,              // Maximum number of connections in the pool (increased from 10)
    min: 2,               // Minimum number of connections to keep alive
    idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds (reduced from 60)
    connectionTimeoutMillis: 10000,  // Return an error after 10 seconds if connection could not be established
    allowExitOnIdle: true  // Allow the pool to exit when all connections are idle
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