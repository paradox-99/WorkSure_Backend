// import pool from "../config/db.js"
const pool = require("../config/db");

const getUsers = async (req, res) => {
     const query = 'SELECT * FROM users WHERE role=\'client\''
     try {
          const result = await pool.query(query)
          res.status(200).json(result.rows)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createUser = async (req, res) => {
     const { email, phone, full_name, gender, date_of_birth, nid, profile_picture, street, city, district, postal_code, lat, lon } = req.body
     console.log(postal_code);
     
     const query = `INSERT INTO users (email, phone, full_name, gender, date_of_birth, nid, password_hash,  profile_picture, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'sdskspassword', $7, now()) RETURNING id`
     try {
          const result = await pool.query(query, [email, phone, full_name, gender, date_of_birth, nid, profile_picture])
          if (result.rows.length === 1) {
               const userId = result.rows[0].id
               
               const addressQuery = `INSERT INTO addresses (user_id, street, city, district, postal_code, lat, lon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
               try {
                    const finalResult = await pool.query(addressQuery, [userId, street, city, district, postal_code, lat, lon])

                    if (finalResult.rowCount > 0)
                         res.status(201).json({ message: 'User created successfully'})
                    else
                         res.status(500).json({ error: 'Failed to insert address' })
               } catch (error) {
                    res.status(500).json({ error: 'Error inserting address:' })
               }
          }
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

module.exports = { getUsers, createUser };