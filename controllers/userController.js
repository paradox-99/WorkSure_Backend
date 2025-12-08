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

const createUser = async (req, res) => {
     const { email, phone, full_name, gender, date_of_birth, nid, profile_picture, street, city, district, postal_code, lat, lon } = req.body
     const query = `INSERT INTO users (email, phone, full_name, gender, date_of_birth, nid, password_hash,  profile_picture, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'sdskspassword', $7, now()) RETURNING id`
     try {
          const result = await pool.query(query, [email, phone, full_name, gender, date_of_birth, nid, profile_picture])
          console.log(result.rows[0]);
          if (result.rows.length !== 0) {
               console.log(result.rows[0].id);
               
          }
          // const userId = result.rows[0].id
          // const addressQuery = `INSERT INTO addresses (user_id, street, city, district, postal_code, lat, lon) VALUES ($1, $2, $3, $4, $5, $6, $7)`
          // await pool.query(addressQuery, [userId, street, city, district, postal_code, lat, lon])
          res.status(201).json(result.rows[0])
     } catch (error) {
          console.error('Error creating user:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

module.exports = { getUsers, createUser };