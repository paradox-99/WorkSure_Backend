const prisma = require('../config/prisma');

const getUsers = async (req, res) => {
     try {
          const users = await prisma.users.findMany({
               where: {
                    role: 'client'
               }
          });
          res.status(200).json(users)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createUser = async (req, res) => {
     const { email, phone, full_name, gender, date_of_birth, nid, profile_picture, street, city, district, postal_code, lat, lon } = req.body

     try {
          await prisma.$transaction(async (tx) => {
               // 1️⃣ Create user
               const user = await tx.users.create({
                    data: {
                         email,
                         phone,
                         full_name,
                         gender,
                         date_of_birth: new Date(date_of_birth),
                         nid,
                         password_hash: "sdskspassword",
                         profile_picture,
                         created_at: new Date()
                    },
                    select: {
                         id: true
                    }
               });

               // 2️⃣ Create address
               await tx.addresses.create({
                    data: {
                         userId: user.id,
                         street,
                         city,
                         district,
                         postal_code,
                         lat,
                         lon
                    }
               });
          });

          res.status(201).json({ message: "User created successfully" });

     } catch (error) {
          console.error("Error creating user:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
}

module.exports = { getUsers, createUser };