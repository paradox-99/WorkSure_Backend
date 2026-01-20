const prisma = require('../config/prisma');

const getUsers = async (req, res) => {
     try {
          const users = await prisma.users.findMany({
               where: {
                    role: 'client'
               },
               select: {
                    id: true,
                    full_name: true,
                    profile_picture: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    gender: true,
                    last_login_at: true,
                    _count: {
                         select: {
                              orders_orders_client_idTousers: true
                         }
                    }
               },
               orderBy: {
                    created_at: 'desc'
               }
          });

          const formattedUsers = users.map(user => ({
               id: user.id,
               name: user.full_name,
               avatar: user.profile_picture || null,
               email: user.email,
               phone: user.phone,
               status: user.status,
               bookingCount: user._count.orders_orders_client_idTousers,
               joinedDate: user.created_at,
               gender: user.gender,
               lastLoginAt: user.last_login_at
          }));

          res.status(200).json(formattedUsers);
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

const createworker = async (req, res) => {
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
          status,
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
               ...(status !== undefined && { status })
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
                    email
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

const getUserById = async (req, res) => {
     const { id } = req.params;

     try {
          const user = await prisma.users.findUnique({
               where: {
                    id
               },
               include: {
                    addresses: {
                         select: {
                              id: true,
                              street: true,
                              city: true,
                              district: true,
                              postal_code: true,
                              lat: true,
                              lon: true
                         }
                    },
                    worker_profiles: {
                         select: {
                              display_name: true,
                              bio: true,
                              years_experience: true,
                              avg_rating: true,
                              total_reviews: true,
                              verification: true
                         }
                    },
                    _count: {
                         select: {
                              orders_orders_client_idTousers: true,
                              orders_orders_assigned_worker_idTousers: true,
                              payments: true,
                              reviews_reviews_reviewer_idTousers: true
                         }
                    }
               }
          });

          if (!user) {
               return res.status(404).json({ error: "User not found" });
          }

          // Format the response for admin panel
          const formattedUser = {
               id: user.id,
               fullName: user.full_name,
               email: user.email,
               phone: user.phone,
               gender: user.gender,
               dateOfBirth: user.date_of_birth,
               nid: user.nid,
               profilePicture: user.profile_picture,
               role: user.role,
               status: user.status,
               createdAt: user.created_at,
               updatedAt: user.updated_at,
               lastLoginAt: user.last_login_at,
               addresses: user.addresses,
               workerProfile: user.worker_profiles,
               statistics: {
                    totalBookingsAsClient: user._count.orders_orders_client_idTousers,
                    totalBookingsAsWorker: user._count.orders_orders_assigned_worker_idTousers,
                    totalPayments: user._count.payments,
                    totalReviews: user._count.reviews_reviews_reviewer_idTousers
               }
          };

          res.status(200).json(formattedUser);
     } catch (error) {
          console.error("Error fetching user by ID:", error);
          res.status(500).json({ error: "Failed to fetch user details" });
     }
};

const suspendUser = async (req, res) => {
     const { id } = req.params;
     const { status } = req.body;

     try {
          // Validate status value
          const validStatuses = ['active', 'suspended', 'inactive'];
          if (status && !validStatuses.includes(status)) {
               return res.status(400).json({ 
                    error: "Invalid status. Must be 'active', 'suspended', or 'inactive'" 
               });
          }

          // Check if user exists
          const existingUser = await prisma.users.findUnique({
               where: { id },
               select: { id: true, full_name: true, status: true }
          });

          if (!existingUser) {
               return res.status(404).json({ error: "User not found" });
          }

          // Update user status
          const updatedUser = await prisma.users.update({
               where: { id },
               data: { 
                    status: status || 'suspended',
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    full_name: true,
                    email: true,
                    status: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               message: `User status updated to ${updatedUser.status} successfully`,
               user: updatedUser
          });
     } catch (error) {
          console.error("Error suspending user:", error);
          res.status(500).json({ error: "Failed to update user status" });
     }
};

const activateUser = async (req, res) => {
     const { id } = req.params;
     const { status } = req.body;

     try {
          // Validate status value
          const validStatuses = ['active', 'suspended', 'inactive'];
          if (status && !validStatuses.includes(status)) {
               return res.status(400).json({ 
                    error: "Invalid status. Must be 'active', 'suspended', or 'inactive'" 
               });
          }

          // Check if user exists
          const existingUser = await prisma.users.findUnique({
               where: { id },
               select: { id: true, full_name: true, status: true }
          });

          if (!existingUser) {
               return res.status(404).json({ error: "User not found" });
          }

          // Update user status
          const updatedUser = await prisma.users.update({
               where: { id },
               data: { 
                    status: status || 'active',
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    full_name: true,
                    email: true,
                    status: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               message: `User status updated to ${updatedUser.status} successfully`,
               user: updatedUser
          });
     } catch (error) {
          console.error("Error activating user:", error);
          res.status(500).json({ error: "Failed to update user status" });
     }
};

module.exports = { getUsers, createUser, updateAddress, updateUser, getUserData, getUserById, suspendUser, activateUser };