// import pkg from 'pg';
// import dotenv from "dotenv";
// const { Pool } = pkg;
// dotenv.config();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.WORKSURE_DATABASE_URL,
});

// export default pool;
module.exports = pool;