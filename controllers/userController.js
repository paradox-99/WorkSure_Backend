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

const getUserByEmail = async (req, res) => {
     const { email } = req.params;

     try {
          const user = await prisma.users.findUnique({
               where: {
                    email
               },
               select: {
                    id: true,
                    full_name: true,
                    profile_picture: true,
                    email: true,
                    role: true
               }
          });

          if (!user) {
               return res.status(404).json({ error: "User not found" });
          }

          res.status(200).json(user);
     } catch (error) {
          console.error("Error fetching user by email:", error);
          res.status(500).json({ error: "Failed to fetch user data" });
     }
}

const checkWorkerAvailability = async (req, res) => {
     const { workerId, selectedTime } = req.body;
     const startTime = new Date(selectedTime);
     const endTime = new Date(startTime.getTime() + 60 * 90 * 1000); // Assuming 1.5 hour booking duration
     
     try {
          // Fetch worker's availability settings
          const workerAvailability = await prisma.availabilities.findFirst({
               where: { user_id: workerId }
          });

          console.log(workerAvailability);
          

          if (!workerAvailability) {
               return res.status(404).json({ 
                    available: false, 
                    message: "Worker availability not configured" 
               });
          }


          // Get day of week from selected time using UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          const dayOfWeek = startTime.getUTCDay();
          console.log("Day of week (UTC):", dayOfWeek, "Date:", startTime.toISOString());
          
          // Standard day names in lowercase for comparison
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const selectedDay = dayNames[dayOfWeek];
          console.log("Selected day:", selectedDay);
          
          // Normalize weekend array to lowercase for case-insensitive comparison
          const normalizedWeekend = workerAvailability.weekend?.map(day => day.toLowerCase().trim()) || [];
          console.log("Normalized weekend:", normalizedWeekend);
          
          // Check if selected date is weekend
          if (normalizedWeekend.includes(selectedDay)) {
               console.log("inside weekend check");
               
               return res.status(200).json({ 
                    available: false, 
                    message: `Worker is not available on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}s (weekend)` 
               });
          }

          // Extract time components from selected time (use UTC to match DB storage)
          const selectedHour = startTime.getHours();
          const selectedMinute = startTime.getMinutes();
          const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;

          // Extract working hours from stored availability (use UTC as stored in DB)
          const availableFromTime = new Date(workerAvailability.available_from);
          const availableToTime = new Date(workerAvailability.available_to);

          const workStartHour = availableFromTime.getUTCHours();
          const workStartMinute = availableFromTime.getUTCMinutes();
          const workStartInMinutes = workStartHour * 60 + workStartMinute;

          const workEndHour = availableToTime.getUTCHours();
          const workEndMinute = availableToTime.getUTCMinutes();
          const workEndInMinutes = workEndHour * 60 + workEndMinute;

          const endTimeInMinutes = endTime.getHours() * 60 + endTime.getMinutes();

          // Check if selected time is within working hours
          if (selectedTimeInMinutes < workStartInMinutes || endTimeInMinutes > workEndInMinutes) {
               return res.status(200).json({ 
                    available: false,  
                    message: `Selected time is outside worker's working hours (${workStartHour}:${String(workStartMinute).padStart(2, '0')} - ${workEndHour}:${String(workEndMinute).padStart(2, '0')})` 
               });
          }

          // Check for overlapping bookings
          const overlappingBookings = await prisma.orders.findMany({
               where: {
                    assigned_worker_id: workerId,
                    status: {
                         in: ['accepted', 'in_progress']
                    },
                    AND: [
                         // Check if selected_time of existing booking is between new booking's start and end
                         {
                              selected_time: {
                                   gte: startTime,
                                   lt: endTime
                              }
                         }
                    ]
               }
          });
          if (overlappingBookings.length > 0) {
               return res.status(200).json({ available: false, message: "Worker is not available at the selected time (booking conflict)." });
          }

          res.status(200).json({ available: true, message: "Worker is available at the selected time." });   
     } catch (error) {
          console.error("Error checking worker availability:", error);
          res.status(500).json({ error: "Failed to check worker availability" });
     }
};

const createReview = async (req, res) => {
     try {
          const { orderId, userId, workerId, rating, comment } = req.body;

          // Validate required fields
          if (!orderId || !userId || !workerId || !rating) {
               return res.status(400).json({ error: "Missing required fields: orderId, userId, workerId, and rating are required" });
          }

          // Validate rating range
          if (rating < 1 || rating > 5) {
               return res.status(400).json({ error: "Rating must be between 1 and 5" });
          }

          // Check if the order exists
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    status: true
               }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Verify that the user is the client of this order
          if (order.client_id !== userId) {
               return res.status(403).json({ error: "You can only review orders that you placed" });
          }

          // Verify that the workerId matches the assigned worker
          if (order.assigned_worker_id !== workerId) {
               return res.status(400).json({ error: "Worker ID does not match the assigned worker for this order" });
          }

          // Check if the order is completed
          if (order.status !== 'completed') {
               return res.status(400).json({ error: "You can only review completed orders" });
          }

          // Check if a review already exists for this order
          const existingReview = await prisma.reviews.findFirst({
               where: {
                    order_id: orderId,
                    user_id: userId
               }
          });

          if (existingReview) {
               return res.status(409).json({ error: "You have already reviewed this order" });
          }

          // Create the review
          const review = await prisma.reviews.create({
               data: {
                    order_id: orderId,
                    user_id: userId,
                    worker_id: workerId,
                    rating: parseInt(rating),
                    comment: comment || null
               },
               include: {
                    users_reviews_user_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              profile_picture: true
                         }
                    },
                    users_reviews_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              profile_picture: true
                         }
                    }
               }
          });

          // Update worker's average rating and total reviews
          const workerReviews = await prisma.reviews.aggregate({
               where: { worker_id: workerId },
               _avg: { rating: true },
               _count: { rating: true }
          });

          await prisma.worker_profiles.update({
               where: { user_id: workerId },
               data: {
                    avg_rating: workerReviews._avg.rating || 0,
                    total_reviews: workerReviews._count.rating || 0
               }
          });

          await prisma.orders.update({
               where: { id: orderId },
               data: {
                    reviewed: true
               }
          });


          res.status(201).json({
               message: "Review created successfully",
               review: {
                    id: review.id,
                    orderId: review.order_id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.created_at,
                    reviewer: {
                         id: review.users_reviews_user_idTousers.id,
                         name: review.users_reviews_user_idTousers.full_name,
                         avatar: review.users_reviews_user_idTousers.profile_picture
                    },
                    worker: {
                         id: review.users_reviews_worker_idTousers.id,
                         name: review.users_reviews_worker_idTousers.full_name,
                         avatar: review.users_reviews_worker_idTousers.profile_picture
                    }
               }
          });

     } catch (error) {
          console.error("Error creating review:", error);
          res.status(500).json({ error: "Failed to create review" });
     }
};

const createComplaint = async (req, res) => {
     // Implementation for creating a complaint
}

module.exports = { getUsers, createUser, updateAddress, updateUser, getUserData, getUserById, suspendUser, activateUser, getUserByEmail, createworker, checkWorkerAvailability, createReview, createComplaint };