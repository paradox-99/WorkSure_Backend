// import pool from "../config/db.js"
const pool = require("../config/db");

const getUsers = async (req, res) => {
     const query = 'SELECT * FROM users'
     try {
          const result = await pool.query(query)
          res.status(200).json(result.rows)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

module.exports = { getUsers };