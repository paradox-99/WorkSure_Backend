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
                              reviews_reviews_user_idTousers: true
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
                    totalReviews: user._count.reviews_reviews_user_idTousers
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
                    is_reviewed: true
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
     try {
          const { 
               raised_by_user_id,
               raised_by_role,
               against_user_id,
               booking_id,
               category,
               sub_category,
               priority,
               subject,
               description,
               attachments 
          } = req.body;

          // Validate required fields
          if (!raised_by_user_id || !raised_by_role || !against_user_id || !booking_id || !category || !description) {
               return res.status(400).json({ 
                    error: "Missing required fields: raised_by_user_id, raised_by_role, against_user_id, booking_id, category, and description are required" 
               });
          }

          // Validate role
          const validRoles = ['client', 'worker', 'admin'];
          if (!validRoles.includes(raised_by_role)) {
               return res.status(400).json({ 
                    error: `Invalid role. Valid roles: ${validRoles.join(", ")}` 
               });
          }

          // Validate priority if provided
          if (priority) {
               const validPriorities = ['low', 'medium', 'high'];
               if (!validPriorities.includes(priority)) {
                    return res.status(400).json({ 
                         error: `Invalid priority. Valid priorities: ${validPriorities.join(", ")}` 
                    });
               }
          }

          // Check if the user raising the complaint exists
          const raisedByUser = await prisma.users.findUnique({
               where: { id: raised_by_user_id },
               select: { id: true, role: true, full_name: true }
          });

          console.log(raisedByUser);
          

          if (!raisedByUser) {
               return res.status(404).json({ error: "User raising complaint not found" });
          }

          // Verify that the role matches
          if (raisedByUser.role !== raised_by_role) {
               return res.status(400).json({ 
                    error: "Provided role does not match user's actual role" 
               });
          }

          // Check if the user against whom complaint is raised exists
          const againstUser = await prisma.users.findUnique({
               where: { id: against_user_id },
               select: { id: true, full_name: true }
          });

          if (!againstUser) {
               return res.status(404).json({ error: "User against whom complaint is raised not found" });
          }

          // Check if the booking exists
          const booking = await prisma.orders.findUnique({
               where: { id: booking_id },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    status: true
               }
          });

          if (!booking) {
               return res.status(404).json({ error: "Booking not found" });
          }

          // Verify that the user is involved in this booking
          if (booking.client_id !== raised_by_user_id && booking.assigned_worker_id !== raised_by_user_id) {
               return res.status(403).json({ 
                    error: "You can only file complaints for bookings you are involved in" 
               });
          }

          // Verify that the against_user is the other party in the booking
          if (booking.client_id !== against_user_id && booking.assigned_worker_id !== against_user_id) {
               return res.status(400).json({ 
                    error: "The user you are complaining against is not involved in this booking" 
               });
          }

          // Fetch payment_id if payment has been made for this booking
          let fetchedPaymentId = null;
          const payment = await prisma.payments.findFirst({
               where: { 
                    order_id: booking_id,
                    status: 'paid'
               },
               select: { id: true },
               orderBy: { created_at: 'desc' }
          });

          if (payment) {
               fetchedPaymentId = payment.id;
          }

          // Create the complaint
          const complaint = await prisma.complaints.create({
               data: {
                    raised_by_user_id,
                    raised_by_role,
                    against_user_id,
                    booking_id,
                    payment_id: fetchedPaymentId,
                    category: category,
                    sub_category: sub_category || null,
                    priority: priority || 'medium',
                    description,
                    attachments: attachments || null,
                    status: 'open'
               }
          });

          await prisma.orders.update({
               where: { id: booking_id },
               data: {
                    is_complained: true,
                    complain_id: complaint.id
               }
          });

          // Create notification for admin
          await prisma.notifications.create({
               data: {
                    user_id: raised_by_user_id,
                    title: 'Complaint Submitted',
                    body: `Your complaint regarding "${subject || category}" has been submitted and is under review.`,
                    is_read: false
               }
          });

          res.status(201).json({
               message: "Complaint filed successfully",
               complaint: {
                    id: complaint.id,
                    raisedBy: raisedByUser.full_name,
                    against: againstUser.full_name,
                    bookingId: complaint.booking_id,
                    category: complaint.category,
                    subCategory: complaint.sub_category,
                    priority: complaint.priority,
                    subject: complaint.subject,
                    description: complaint.description,
                    status: complaint.status,
                    createdAt: complaint.created_at
               }
          });

     } catch (error) {
          console.error("Error creating complaint:", error);
          res.status(500).json({ error: "Failed to create complaint" });
     }
}

const getComplaintDetails = async (req, res) => {
     try {
          const { complaintId } = req.params;

          if (!complaintId) {
               return res.status(400).json({ error: "Complaint ID is required" });
          }

          // Fetch complaint with all related details
          const complaint = await prisma.complaints.findUnique({
               where: { id: complaintId },
               select: {
                    id: true,
                    raised_by_user_id: true,
                    raised_by_role: true,
                    against_user_id: true,
                    booking_id: true,
                    payment_id: true,
                    category: true,
                    sub_category: true,
                    priority: true,
                    description: true,
                    attachments: true,
                    status: true,
                    admin_notes: true,
                    resolution: true,
                    created_at: true,
                    updated_at: true,
                    resolved_at: true
               }
          });

          if (!complaint) {
               return res.status(404).json({ error: "Complaint not found" });
          }

          // Fetch the user who raised the complaint
          const raisedByUser = await prisma.users.findUnique({
               where: { id: complaint.raised_by_user_id },
               select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                    profile_picture: true,
                    role: true
               }
          });

          // Fetch the user against whom the complaint is raised
          const againstUser = await prisma.users.findUnique({
               where: { id: complaint.against_user_id },
               select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                    profile_picture: true,
                    role: true
               }
          });

          // Fetch booking details
          const booking = await prisma.orders.findUnique({
               where: { id: complaint.booking_id },
               select: {
                    id: true,
                    status: true,
                    selected_time: true,
                    total_amount: true,
                    description: true,
                    address: true,
                    work_start: true,
                    work_end: true,
                    created_at: true
               }
          });

          // Fetch payment details if payment_id exists
          let payment = null;
          if (complaint.payment_id) {
               payment = await prisma.payments.findUnique({
                    where: { id: complaint.payment_id },
                    select: {
                         id: true,
                         amount: true,
                         status: true,
                         payment_method: true,
                         trx_id: true,
                         paid_at: true,
                         created_at: true
                    }
               });
          }

          // Format the response
          const complaintDetails = {
               id: complaint.id,
               raisedBy: {
                    id: raisedByUser?.id,
                    name: raisedByUser?.full_name,
                    email: raisedByUser?.email,
                    phone: raisedByUser?.phone,
                    avatar: raisedByUser?.profile_picture,
                    role: raisedByUser?.role
               },
               against: {
                    id: againstUser?.id,
                    name: againstUser?.full_name,
                    email: againstUser?.email,
                    phone: againstUser?.phone,
                    avatar: againstUser?.profile_picture,
                    role: againstUser?.role
               },
               booking: booking ? {
                    id: booking.id,
                    status: booking.status,
                    scheduledTime: booking.selected_time,
                    totalAmount: booking.total_amount,
                    description: booking.description,
                    address: booking.address,
                    workStart: booking.work_start,
                    workEnd: booking.work_end,
                    createdAt: booking.created_at
               } : null,
               payment: payment ? {
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    method: payment.payment_method,
                    transactionId: payment.trx_id,
                    paidAt: payment.paid_at,
                    createdAt: payment.created_at
               } : null,
               category: complaint.category,
               subCategory: complaint.sub_category,
               priority: complaint.priority,
               subject: complaint.subject,
               description: complaint.description,
               attachments: complaint.attachments,
               status: complaint.status,
               adminNotes: complaint.admin_notes,
               resolution: complaint.resolution,
               createdAt: complaint.created_at,
               updatedAt: complaint.updated_at,
               resolvedAt: complaint.resolved_at
          };

          res.status(200).json({
               success: true,
               complaintDetails
          });

     } catch (error) {
          console.error("Error fetching complaint details:", error);
          res.status(500).json({ error: "Failed to fetch complaint details" });
     }
};


/**
 * Get User Notifications
 * Returns all notifications for a user
 * @route GET /api/userRoutes/notifications/:id
 */
const getUserNotifications = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    // Fetch user by id
    const user = await prisma.users.findUnique({
      where: { id: id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'client') {
      return res.status(403).json({
        error: 'Access denied. This endpoint is only accessible to clients.'
      });
    }

    // Fetch notifications for the user
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.status(200).json({
      success: true,
      total: notifications.length,
      unread: unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
};

/**
 * Mark Notification as Read
 * @route PATCH /api/userRoutes/notifications/:id/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notifications.update({
      where: { id },
      data: { is_read: true }
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      error: 'Failed to update notification',
      message: error.message
    });
  }
};

/**
 * Mark All Notifications as Read
 * @route PATCH /api/userRoutes/notifications/read-all/:id
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Id is required' });
    }

    // Fetch user by id
    const user = await prisma.users.findUnique({
      where: { id: id },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'client') {
      return res.status(403).json({
        error: 'Access denied. This endpoint is only accessible to clients.'
      });
    }

    // Update all unread notifications
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: user.id,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: result.count
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      error: 'Failed to update notifications',
      message: error.message
    });
  }
};

/**
 * Get all reviews written by a user
 * @route GET /api/userRoutes/reviews/:userId
 */
const getUserReviews = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        full_name: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination using transaction
    const [reviews, totalCount] = await prisma.$transaction(async (tx) => {
      return Promise.all([
        tx.reviews.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true,
            order_id: true,
            users_reviews_worker_idTousers: {
              select: {
                id: true,
                full_name: true,
                profile_picture: true,
                worker_profiles: {
                  select: {
                    display_name: true,
                    avg_rating: true
                  }
                }
              }
            },
            orders: {
              select: {
                id: true,
                description: true,
                status: true,
                selected_time: true
              }
            }
          },
          orderBy: {
            [sortBy]: order.toLowerCase()
          },
          skip: skip,
          take: parseInt(limit)
        }),
        tx.reviews.count({
          where: { user_id: userId }
        })
      ]);
    });

    // Transform the data
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      order_id: review.order_id,
      order_details: {
        description: review.orders?.description || null,
        status: review.orders?.status || null,
        service_date: review.orders?.selected_time || null
      },
      worker: {
        id: review.users_reviews_worker_idTousers?.id || null,
        name: review.users_reviews_worker_idTousers?.full_name || 'Unknown',
        display_name: review.users_reviews_worker_idTousers?.worker_profiles?.display_name || null,
        profile_picture: review.users_reviews_worker_idTousers?.profile_picture || null,
        avg_rating: review.users_reviews_worker_idTousers?.worker_profiles?.avg_rating || 0
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        user_name: user.full_name,
        total_reviews: totalCount,
        reviews: transformedReviews,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          per_page: parseInt(limit),
          total_count: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};


module.exports = { getUsers, createUser, updateAddress, updateUser, getUserData, getUserById, suspendUser, activateUser, getUserByEmail, createworker, checkWorkerAvailability, createReview, createComplaint, getComplaintDetails, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUserReviews };