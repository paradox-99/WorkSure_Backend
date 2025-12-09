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
     const { user_id, display_name, bio, years_experience, category_id, base_price, price_unit, skills, available_from, available_to, weekend, area_geometry } = req.body

     const query = `INSERT INTO worker_profiles (user_id, display_name, bio, years_experience, created_at) VALUES ($1, $2, $3, $4, now()) RETURNING id`
     try {
          const result = await pool.query(query, [user_id, display_name, bio, years_experience])
          res.status(201).json({ message: 'Worker created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerService = async (req, res) => {
     const { user_id, category_id, base_price, price_unit, skills } = req.body

     const query = `INSERT INTO worker_services (worker_id, category_id, base_price, price_unit, skills) VALUES ($1, $2, $3, $4, $5) RETURNING id`
     try {
          const result = await pool.query(query, [user_id, category_id, base_price, price_unit, skills])
          res.status(201).json({ message: 'Worker Service created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerAvailability = async (req, res) => {
     const { user_id, available_from, available_to, weekend, area_geometry } = req.body

     const query = `INSERT INTO worker_availabilities (worker_id, available_from, available_to, weekend, area_geometry) VALUES ($1, $2, $3, $4) RETURNING id`
     try {
          const result = await pool.query(query, [user_id, available_from, available_to, weekend])
          res.status(201).json({ message: 'Worker Availability created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

module.exports = { getWorkers };