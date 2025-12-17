const prisma = require("../config/prisma");

const getWorkers = async (req, res) => {
     try {
          const workers = await prisma.users.findMany({
               where: {
                    role: 'worker'
               }
          })
          res.status(200).json(workers)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorker = async (req, res) => {
     const { user_id, display_name, bio, years_experience, category_id, base_price, price_unit, skills, available_from, available_to, weekend, area_geometry } = req.body

     try {
          await prisma.worker_profiles.create({
               data: {
                    user_id,
                    display_name,
                    bio,
                    years_experience,
                    created_at: new Date()
               }
          })
          res.status(201).json({ message: 'Worker created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerService = async (req, res) => {
     const { user_id, category_id, base_price, price_unit, skills } = req.body

     try {
          await prisma.worker_services.create({
               data: {
                    user_id,
                    category_id,
                    base_price,
                    price_unit,
                    skills
               }
          })
          res.status(201).json({ message: 'Worker Service created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerAvailability = async (req, res) => {
     const { user_id, available_from, available_to, weekend } = req.body

     try {
          await prisma.availabilities.create({
               data: {
                    worker_id: user_id,
                    available_from: new Date(available_from),
                    available_to: new Date(available_to),
                    weekend
               }
          })
          res.status(201).json({ message: 'Worker Availability created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const searchWorkers = async (req, res) => {
     const { categorySlug, lat, lon, radiusMeters } = req.query

     console.log(categorySlug);
     

     try {
          const workers = await prisma.$queryRaw`
          WITH cat AS (
            SELECT id FROM service_categories WHERE slug = ${categorySlug}
          )
          SELECT
            u.id AS user_id,
            u.profile_picture,
            wp.display_name,
            wp.avg_rating,
            a.lat,
            a.lon,
            ws.base_price,
            ST_Distance(
              ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
            ) AS distance_m
          FROM worker_services ws
          JOIN users u ON ws.user_id = u.id
          JOIN worker_profiles wp ON wp.user_id = u.id
          LEFT JOIN addresses a ON a.user_id = u.id
          WHERE ws.category_id = (SELECT id FROM cat)
            AND wp.verification = 'verified'
            AND a.lat IS NOT NULL
            AND a.lon IS NOT NULL
            AND ST_DWithin(
              ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
              ${radiusMeters}
            )`;
            
          res.status(200).json(workers)
     } catch (error) {
          console.error('Error searching workers:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

module.exports = { getWorkers, searchWorkers, createWorker, createWorkerService, createWorkerAvailability };