const { PrismaClient } = require('../generated/prisma/client'); // or your generated path
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

// 1. Create a Postgres connection pool
const pool = new Pool({ 
  connectionString: process.env.URL 
});

// 2. Create the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to PrismaClient (Satisfies the "non-empty options" requirement)
const prisma = new PrismaClient({ adapter });

module.exports = prisma;