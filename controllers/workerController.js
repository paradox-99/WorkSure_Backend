const pool = require("../config/db");


const getWorkers = async (req, res) => {
     const query = 'SELECT * FROM users WHERE role=\'worker\''
     try {
          const result = await pool.query(query)
          res.status(200).json(result.rows)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorker = async (req, res) => {
     
}

module.exports = { getWorkers };