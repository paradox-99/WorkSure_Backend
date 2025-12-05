import pkg from 'pg';
import dotenv from "dotenv";
const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.URL,
});

export default pool;