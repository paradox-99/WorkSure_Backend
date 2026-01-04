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

const updateAddress = async (req, res) => {
     const { addressId } = req.params;

     const {
          street,
          city,
          district,
          postal_code,
          lat,
          lon
     } = req.body;

     try {
          const updatedAddress = await prisma.address.update({
               where: { id: addressId },
               data: {
                    ...(street !== undefined && { street }),
                    ...(city !== undefined && { city }),
                    ...(district !== undefined && { district }),
                    ...(postal_code !== undefined && { postal_code }),
                    ...(lat !== undefined && { lat }),
                    ...(lon !== undefined && { lon })
               }
          });

          res.status(200).json(updatedAddress);
     } catch (error) {
          console.error("Error updating address:", error);
          res.status(500).json({ error: "Failed to update address" });
     }
};

const updateUser = async (req, res) => {
     const { id } = req.params;

     const {
          email,
          phone,
          full_name,
          gender,
          date_of_birth,
          nid,
          profile_picture,
          role,
          last_login_at,
          is_active
     } = req.body;

     try {
          const data = {
               ...(email !== undefined && { email }),
               ...(phone !== undefined && { phone }),
               ...(full_name !== undefined && { full_name }),
               ...(gender !== undefined && { gender }),
               ...(date_of_birth !== undefined && {
                    date_of_birth: new Date(date_of_birth)
               }),
               ...(nid !== undefined && { nid }),
               ...(profile_picture !== undefined && { profile_picture }),
               ...(role !== undefined && { role }),
               ...(last_login_at !== undefined && {
                    last_login_at: new Date(last_login_at)
               }),
               ...(is_active !== undefined && { is_active })
          };


          if (Object.keys(data).length === 0) {
               return res.status(400).json({ error: "No valid fields to update" });
          }

          const updatedUser = await prisma.user.update({
               where: { id },
               data
          });

          res.status(200).json(updatedUser);
     } catch (error) {
          console.error("Error updating user:", error);
          res.status(500).json({ error: "Failed to update user" });
     }
};

const getUserData = async (req, res) => {
     const { email } = req.params;

     try {
          const user = await prisma.users.findUnique({
               where: {
                    email,
                    role: 'client'
               },
               include: {
                    addresses: true
               }
          });
          

          if (!user) {
               return res.status(404).json({ error: "User not found" });
          }

          res.status(200).json(user);
     } catch (error) {
          console.error("Error fetching user data:", error);
          res.status(500).json({ error: "Failed to fetch user data" });
     }
};

module.exports = { getUsers, createUser, updateAddress, updateUser, getUserData };