const prisma = require("../config/prisma");
const { sendHiringRequestEmail } = require("./mailController");

const createOrder = async (req, res) => {
     const { client_email, worker_id, selected_time, address, description, total_amount } = req.body;

     try {
          // Fetch client_id from users table using client_email
          const client = await prisma.users.findUnique({
               where: { email: client_email },
               select: { id: true, full_name: true }
          });

          if (!client) {
               return res.status(404).json({ error: "Client not found with provided email" });
          }

          const client_id = client.id;

          // Fetch worker details for email notification
          const worker = await prisma.users.findUnique({
               where: { id: worker_id },
               select: { id: true, email: true, full_name: true }
          });

          if (!worker) {
               return res.status(404).json({ error: "Worker not found" });
          }

          // Create the order
          const order = await prisma.orders.create({
               data: {
                    client_id,
                    assigned_worker_id: worker_id,
                    selected_time: selected_time ? new Date(selected_time) : null,
                    address,
                    description: description || null,
                    status: "pending",
                    payment_completed: false,
                    total_amount: total_amount || 0.0
               }
          });

          // Send email notification to worker (non-blocking)
          sendHiringRequestEmail({
               workerEmail: worker.email,
               workerName: worker.full_name,
               clientName: client.full_name,
               address,
               description,
               selectedTime: selected_time
          }).catch(err => {
               console.error('Failed to send hiring request email:', err);
          });

          res.status(201).json({
               message: "Order created successfully",
               order
          });
     } catch (error) {
          console.error("Error creating order:", error);

          // Handle database constraint violations
          if (error.code === "P2025") {
               return res.status(404).json({ error: "Client or Worker not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const getOrders = async (req, res) => {
     const { client_id, worker_id, status } = req.query;

     try {
          const where = {};

          if (client_id) {
               where.client_id = client_id;
          }

          if (worker_id) {
               where.assigned_worker_id = worker_id;
          }

          if (status) {
               where.status = status;
          }

          const orders = await prisma.orders.findMany({
               where,
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    selected_time: true,
                    address: true,
                    description: true,
                    status: true,
                    total_amount: true,
                    currency: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true
                         }
                    }
               },
               orderBy: {
                    created_at: "desc"
               }
          });

          res.status(200).json(orders);
     } catch (error) {
          console.error("Error fetching orders:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
};

const getOrderById = async (req, res) => {
     const { orderId } = req.params;

     try {
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    selected_time: true,
                    address: true,
                    description: true,
                    status: true,
                    total_amount: true,
                    currency: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true,
                              worker_profiles: {
                                   select: {
                                        display_name: true,
                                        avg_rating: true,
                                        total_reviews: true
                                   }
                              }
                         }
                    },
                    payments: {
                         select: {
                              id: true,
                              amount: true,
                              status: true,
                              payment_method: true,
                              paid_at: true
                         }
                    },
                    reviews: {
                         select: {
                              id: true,
                              rating: true,
                              comment: true,
                              created_at: true
                         }
                    }
               }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(200).json(order);
     } catch (error) {
          console.error("Error fetching order:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
};

const updateOrderStatus = async (req, res) => {
     const { orderId } = req.params;
     const { status } = req.body;

     if (!status) {
          return res.status(400).json({ error: "Status is required" });
     }

     const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];

     if (!validStatuses.includes(status)) {
          return res.status(400).json({
               error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
          });
     }

     try {
          const updatedOrder = await prisma.orders.update({
               where: { id: orderId },
               data: {
                    status,
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    status: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               message: "Order status updated successfully",
               order: updatedOrder
          });
     } catch (error) {
          console.error("Error updating order status:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const cancelOrder = async (req, res) => {
     const { orderId } = req.params;

     try {
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: { status: true }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Only allow cancellation if status is pending or accepted
          if (!["pending", "accepted"].includes(order.status)) {
               return res.status(400).json({
                    error: `Cannot cancel order with status: ${order.status}`
               });
          }

          const cancelledOrder = await prisma.orders.update({
               where: { id: orderId },
               data: {
                    status: "cancelled",
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    status: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               message: "Order cancelled successfully",
               order: cancelledOrder
          });
     } catch (error) {
          console.error("Error cancelling order:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
};

const getUserOrder = async (req, res) => {
     const { email } = req.params;

     try {

          const client = await prisma.users.findUnique({
               where: { email: email },
               select: { id: true }
          });

          if (!client) {
               return res.status(404).json({ error: "Client not found with provided email" });
          }

          const client_id = client.id;

          const orders = await prisma.orders.findMany({
               where: {
                    client_id: client_id
               },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    selected_time: true,
                    address: true,
                    description: true,
                    status: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    work_start: true,
                    work_end: true,
                    is_reviewed: true,
                    is_complained: true,
                    complain_id: true,
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true,
                              worker_profiles: {
                                   select: {
                                        display_name: true,
                                        avg_rating: true,
                                        total_reviews: true
                                   }
                              }
                         }
                    }
               },
               orderBy: {
                    created_at: "desc"
               }
          });

          res.status(200).json(orders);
     } catch (error) {
          console.error("Error fetching user orders:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
};

const getWorkerHirings = async (req, res) => {
     const { email } = req.params;

     try {
          const worker = await prisma.users.findUnique({
               where: { email },
               select: { id: true }
          });

          if (!worker) {
               return res.status(404).json({ error: "Worker not found with provided email" });
          }

          const worker_id = worker.id;

          const orders = await prisma.orders.findMany({
               where: { assigned_worker_id: worker_id },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    selected_time: true,
                    address: true,
                    description: true,
                    status: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    work_start: true,
                    work_end: true,
                    is_reviewed: true,
                    is_complained: true,
                    complain_id: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true
                         }
                    }
               },
               orderBy: { created_at: 'desc' }
          });

          res.status(200).json(orders);
     } catch (error) {
          console.error('Error fetching worker hirings:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
};

const getWorkerRequests = async (req, res) => {
     const { email } = req.params;

     try {
          const worker = await prisma.users.findUnique({
               where: { email },
               select: { id: true }
          });

          if (!worker) {
               return res.status(404).json({ error: "Worker not found with provided email" });
          }

          const worker_id = worker.id;

          const orders = await prisma.orders.findMany({
               where: { assigned_worker_id: worker_id, status: 'pending' },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    selected_time: true,
                    address: true,
                    description: true,
                    status: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    work_start: true,
                    work_end: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true
                         }
                    }
               },
               orderBy: { created_at: 'desc' }
          });

          res.status(200).json(orders);
     } catch (error) {
          console.error('Error fetching worker requests:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
};

const acceptRequest = async (req, res) => {
     const { orderId } = req.params;
     const { workerEmail } = req.body;
     
     try {
          if (!orderId || !workerEmail) {
               return res.status(400).json({ error: 'Order ID and Worker Email are required' });
          }

          // Lookup worker by email
          const worker = await prisma.users.findUnique({
               where: { email: workerEmail },
               select: { id: true }
          });

          if (!worker) {
               return res.status(404).json({ error: 'Worker not found with provided email' });
          }

          const workerId = worker.id;

          const order = await prisma.orders.findUnique({ where: { id: orderId } });

          if (!order) {
               return res.status(404).json({ error: 'Order not found' });
          }

          if (order.status !== 'pending') {
               return res.status(400).json({ error: `Order with status '${order.status}' cannot be accepted` });
          }

          if (order.assigned_worker_id && order.assigned_worker_id !== workerId) {
               return res.status(403).json({ error: 'This order is already assigned to another worker' });
          }

          const updatedOrder = await prisma.orders.update({
               where: { id: orderId },
               data: {
                    assigned_worker_id: workerId,
                    status: 'accepted',
                    updated_at: new Date()
               },
          });

          // Notify client
          await prisma.notifications.create({
               data: {
                    user_id: order.client_id,
                    title: 'Work Request Accepted',
                    body: 'A worker has accepted your work request and will be arriving soon.',
                    is_read: false
               }
          });

          res.status(200).json({ message: 'Work request accepted successfully' });
     } catch (error) {
          console.error('Error accepting work request:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
};

const cancelRequest = async (req, res) => {
     const { orderId } = req.params;
     const { workerEmail, reason } = req.body;

     try {
          if (!orderId || !workerEmail) {
               return res.status(400).json({ error: 'Order ID and Worker Email are required' });
          }

          if (!reason || reason.trim() === '') {
               return res.status(400).json({ error: 'Cancellation reason is required' });
          }

          // Lookup worker by email
          const worker = await prisma.users.findUnique({
               where: { email: workerEmail },
               select: { id: true }
          });

          if (!worker) {
               return res.status(404).json({ error: 'Worker not found with provided email' });
          }

          const workerId = worker.id;

          const order = await prisma.orders.findUnique({ where: { id: orderId } });

          if (!order) {
               return res.status(404).json({ error: 'Order not found' });
          }

          if (order.assigned_worker_id !== workerId) {
               return res.status(403).json({ error: 'Worker is not assigned to this order' });
          }

          const cancellableStatuses = ['pending', 'accepted', 'in_progress'];
          if (!cancellableStatuses.includes(order.status)) {
               return res.status(400).json({ error: `Order with status '${order.status}' cannot be cancelled` });
          }

          const updatedOrder = await prisma.orders.update({
               where: { id: orderId },
               data: {
                    status: 'cancelled',
                    cancel_reason: reason,
                    canceled_by: 'worker',
                    updated_at: new Date()
               }
          });

          // Notify client
          await prisma.notifications.create({
               data: {
                    user_id: order.client_id,
                    title: 'Work Request Cancelled',
                    body: `The worker has cancelled the work request. Reason: ${reason}`,
                    is_read: false
               }
          });

          res.status(200).json({ message: 'Work request cancelled successfully', order: updatedOrder });
     } catch (error) {
          console.error('Error cancelling work request:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
};

const startWork = async (req, res) => {
     const { orderId } = req.params;
     const { workerEmail } = req.body;

     try {
          if (!orderId || !workerEmail) {
               return res.status(400).json({ error: 'Order ID and Worker Email are required' });
          }

          const order = await prisma.orders.findUnique({
               where: { id: orderId }
          });

          if (!order) {
               return res.status(404).json({ error: 'Order not found' });
          }

          const worker = await prisma.users.findUnique({
               where: { email: workerEmail },
               select: { id: true }
          });

          if (!worker) {
               return res.status(404).json({ error: 'Worker not found with provided email' });
          }

          const workerId = worker.id;

          if (order.assigned_worker_id !== workerId) {
               return res.status(403).json({ error: 'Worker is not assigned to this order' });
          }

          if (order.status !== 'accepted') {
               return res.status(400).json({ error: `Order with status '${order.status}' cannot be started. Order must be accepted first.` });
          }

          const startTime = new Date();

          const updatedOrder = await prisma.orders.update({
               where: { id: orderId },
               data: {
                    status: 'in_progress',
                    work_start: startTime,
                    updated_at: startTime
               },
               include: {
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true
                         }
                    }
               }
          });

          // Notify client that work has started
          await prisma.notifications.create({
               data: {
                    user_id: order.client_id,
                    title: 'Work Started',
                    body: 'The worker has started working on your request.',
                    is_read: false
               }
          });

          res.status(200).json({
               message: 'Work started successfully',
               order: updatedOrder,
               work_start: startTime
          });
     } catch (error) {
          console.error('Error starting work:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
};

const getStartTime = async (req, res) => {
     const {orderId } = req.params;

     try {
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: { work_start: true }
          });

          if (!order) {
               return null;
          }

          res.status(200).json({ work_start: order.work_start });
     }
     catch (error) {
          console.error('Error fetching work start time:', error);
          res.status(500).json({ error: 'Internal Server Error' });
     }
}

const addExtraItem = async (req, res) => {
     const { orderId } = req.params;
     const { items, additional_notes } = req.body;
     const endTime = new Date();

     const additional_price = items[0].total_price;
     

     try {
          // Check if order exists
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: { total_amount: true, status: true }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Check if order is in a valid state for adding items
          if (order.status === "completed" || order.status === "cancelled") {
               return res.status(400).json({ 
                    error: "Cannot add items to a completed or cancelled order" 
               });
          }

          // Create the order item
          const orderItem = await prisma.order_items.create({
               data: {
                    order_id: orderId,
                    items: items,
                    additional_notes: additional_notes || "No items needed.",
                    verified: false
               }
          });


          const total_amount = parseInt(order.total_amount) + additional_price;

          await prisma.orders.update({
               where: { id: orderId },
               data: {
                    work_end: endTime,
                    status: "awaiting",
                    updated_at: endTime,
                    items_approval: false,
                    total_amount: total_amount
               }
          });

          res.status(201).json({
               message: "Extra item added successfully",
               orderItem
          });
     } catch (error) {
          console.error("Error adding extra item:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const acceptExtraItems = async (req, res) => {
     const { orderId } = req.params;

     try {
          // Check if order exists
          const order = await prisma.orders.findUnique({
               where: { id: orderId }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Update order items to verified
          await prisma.order_items.updateMany({
               where: { 
                    order_id: orderId,
                    verified: false
               },
               data: {
                    verified: true,
                    updated_at: new Date()
               }
          });

          // Update order items_approval to true
          await prisma.orders.update({
               where: { id: orderId },
               data: {
                    items_approval: true,
                    status: "completed",
                    updated_at: new Date()
               }
          });

          res.status(200).json({
               message: "Extra items accepted successfully"
          });
     } catch (error) {
          console.error("Error accepting extra items:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const getAwaitingWorkDetails = async (req, res) => {
     const { orderId } = req.params;

     try {
          // Fetch order with full details including reviews and ratings
          const order = await prisma.orders.findUnique({
               where: { id: orderId },
               select: {
                    id: true,
                    client_id: true,
                    assigned_worker_id: true,
                    status: true,
                    work_start: true,
                    work_end: true,
                    total_amount: true,
                    description: true,
                    address: true,
                    selected_time: true,
                    payment_completed: true,
                    cancel_reason: true,
                    canceled_by: true,
                    items_approval: true,
                    created_at: true,
                    updated_at: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true,
                              worker_profiles: {
                                   select: {
                                        display_name: true,
                                        bio: true,
                                        years_experience: true,
                                        avg_rating: true,
                                        total_reviews: true,
                                        verification: true
                                   }
                              }
                         }
                    },
                    order_items: {
                         select: {
                              id: true,
                              items: true,
                              additional_notes: true,
                              verified: true,
                              created_at: true,
                              updated_at: true
                         }
                    },
                    payments: {
                         select: {
                              id: true,
                              amount: true,
                              status: true,
                              payment_method: true,
                              trx_id: true,
                              paid_at: true,
                              created_at: true
                         },
                         orderBy: {
                              created_at: 'desc'
                         }
                    },
                    reviews: {
                         select: {
                              id: true,
                              rating: true,
                              comment: true,
                              created_at: true,
                              users_reviews_user_idTousers: {
                                   select: {
                                        id: true,
                                        full_name: true,
                                        profile_picture: true
                                   }
                              }
                         }
                    }
               }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(200).json({
               order
          });
     } catch (error) {
          console.error("Error fetching awaiting work details:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

// ============================================
// ADMIN BOOKING MANAGEMENT APIs
// ============================================

/**
 * Get all bookings with filters & pagination (Admin)
 * Fields: Booking ID, User, Worker, Service, Scheduled, Status, Payment, Amount, Created at
 */
const adminGetAllBookings = async (req, res) => {
     try {
          const { 
               page = 1, 
               limit = 10, 
               status, 
               category,
               paymentStatus, 
               dateFrom,
               dateTo,
               sortBy = 'created_at',
               sortOrder = 'desc'
          } = req.query;

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const take = parseInt(limit);

          // Build where clause
          const where = {};

          if (status) {
               where.status = status;
          }

          if (paymentStatus) {
               where.payment_completed = paymentStatus === 'paid';
          }

          // Filter by category (service category slug)
          if (category) {
               where.users_orders_assigned_worker_idTousers = {
                    worker_services: {
                         some: {
                              OR: [
                                   {
                                        service_categories: {
                                             slug: category
                                        }
                                   },
                                   {
                                        service_sections: {
                                             slug: category
                                        }
                                   }
                              ]
                         }
                    }
               };
          }
          
          if (dateFrom || dateTo) {
               where.created_at = {};
               if (dateFrom) {
                    where.created_at.gte = new Date(dateFrom);
               }
               if (dateTo) {
                    where.created_at.lte = new Date(dateTo);
               }
          }

          // Get total count
          const totalCount = await prisma.orders.count({ where });

          // Fetch bookings
          const bookings = await prisma.orders.findMany({
               where,
               skip,
               take,
               select: {
                    id: true,
                    status: true,
                    selected_time: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    users_orders_client_idTousers: {
                         select: {
                              full_name: true,
                              phone: true
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              full_name: true,
                              worker_profiles: {
                                   select: {
                                        display_name: true,
                                        avg_rating: true
                                   }
                              },
                              worker_services: {
                                   select: {
                                        service_sections: {
                                             select: {
                                                  name: true
                                             }
                                        }
                                   }
                              }
                         }
                    },
                    payments: {
                         select: {
                              status: true
                         },
                         orderBy: {
                              created_at: 'desc'
                         },
                         take: 1
                    }
               },
               orderBy: {
                    [sortBy]: sortOrder
               }
          });

          // Format response
          const formattedBookings = bookings.map(booking => ({
               bookingId: booking.id,
               user: booking.users_orders_client_idTousers ? {
                    name: booking.users_orders_client_idTousers.full_name,
                    phone: booking.users_orders_client_idTousers.phone
               } : null,
               worker: booking.users_orders_assigned_worker_idTousers ? {
                    name: booking.users_orders_assigned_worker_idTousers.full_name,
                    displayName: booking.users_orders_assigned_worker_idTousers.worker_profiles?.display_name,
                    rating: booking.users_orders_assigned_worker_idTousers.worker_profiles?.avg_rating
               } : null,
               serviceSection: booking.users_orders_assigned_worker_idTousers?.worker_services?.[0]?.service_sections ? {
                    name: booking.users_orders_assigned_worker_idTousers.worker_services[0].service_sections.name,
               } : null,
               scheduled: booking.selected_time,
               status: booking.status,
               paymentStatus: booking.payment_completed ? 'paid' : 'unpaid',
               createdAt: booking.created_at,
               amount: booking.total_amount
          }));

          res.status(200).json({
               success: true,
               data: formattedBookings,
               pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
               }
          });
     } catch (error) {
          console.error("Error fetching admin bookings:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Get single booking details (Admin)
 */
const adminGetBookingById = async (req, res) => {
     try {
          const { id } = req.params;

          const booking = await prisma.orders.findUnique({
               where: { id },
               select: {
                    id: true,
                    status: true,
                    selected_time: true,
                    work_start: true,
                    work_end: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    updated_at: true,
                    address: true,
                    description: true,
                    cancel_reason: true,
                    canceled_by: true,
                    items_approval: true,
                    users_orders_client_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true,
                              date_of_birth: true,
                              gender: true,
                              addresses: {
                                   select: {
                                        street: true,
                                        city: true,
                                        district: true,
                                        postal_code: true
                                   }
                              }
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true,
                              profile_picture: true,
                              worker_profiles: {
                                   select: {
                                        display_name: true,
                                        bio: true,
                                        years_experience: true,
                                        avg_rating: true,
                                        total_reviews: true,
                                        verification: true
                                   }
                              }
                         }
                    },
                    payments: {
                         select: {
                              id: true,
                              amount: true,
                              status: true,
                              payment_method: true,
                              trx_id: true,
                              paid_at: true,
                              created_at: true
                         },
                         orderBy: {
                              created_at: 'desc'
                         }
                    },
                    order_items: {
                         select: {
                              id: true,
                              items: true,
                              additional_notes: true,
                              verified: true,
                              created_at: true
                         }
                    },
                    reviews: {
                         select: {
                              id: true,
                              rating: true,
                              comment: true,
                              created_at: true,
                              users_reviews_reviewer_idTousers: {
                                   select: {
                                        full_name: true,
                                        email: true
                                   }
                              }
                         }
                    }
               }
          });

          if (!booking) {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          res.status(200).json({
               success: true,
               data: booking
          });
     } catch (error) {
          console.error("Error fetching booking details:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Update booking status (Admin)
 */
const adminUpdateBookingStatus = async (req, res) => {
     try {
          const { id } = req.params;
          const { status, reason } = req.body;

          if (!status) {
               return res.status(400).json({ 
                    success: false,
                    error: "Status is required" 
               });
          }

          const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled", "disputed", "awaiting"];

          if (!validStatuses.includes(status)) {
               return res.status(400).json({
                    success: false,
                    error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
               });
          }

          const updateData = {
               status,
               updated_at: new Date()
          };

          // If cancelling, add reason
          if (status === 'cancelled' && reason) {
               updateData.cancel_reason = reason;
               updateData.canceled_by = 'admin';
          }

          const updatedBooking = await prisma.orders.update({
               where: { id },
               data: updateData,
               select: {
                    id: true,
                    status: true,
                    cancel_reason: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               success: true,
               message: "Booking status updated successfully",
               data: updatedBooking
          });
     } catch (error) {
          console.error("Error updating booking status:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Assign/reassign worker to booking (Admin)
 */
const adminAssignWorker = async (req, res) => {
     try {
          const { id } = req.params;
          const { workerId } = req.body;

          if (!workerId) {
               return res.status(400).json({ 
                    success: false,
                    error: "Worker ID is required" 
               });
          }

          // Check if worker exists and has worker role
          const worker = await prisma.users.findUnique({
               where: { id: workerId },
               select: {
                    id: true,
                    role: true,
                    full_name: true,
                    worker_profiles: {
                         select: {
                              verification: true
                         }
                    }
               }
          });

          if (!worker) {
               return res.status(404).json({ 
                    success: false,
                    error: "Worker not found" 
               });
          }

          if (worker.role !== 'worker') {
               return res.status(400).json({ 
                    success: false,
                    error: "User is not a worker" 
               });
          }

          // Update booking
          const updatedBooking = await prisma.orders.update({
               where: { id },
               data: {
                    assigned_worker_id: workerId,
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    assigned_worker_id: true,
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true
                         }
                    },
                    updated_at: true
               }
          });

          res.status(200).json({
               success: true,
               message: "Worker assigned successfully",
               data: updatedBooking
          });
     } catch (error) {
          console.error("Error assigning worker:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Cancel booking (Admin)
 */
const adminCancelBooking = async (req, res) => {
     try {
          const { id } = req.params;
          const { reason } = req.body;

          if (!reason) {
               return res.status(400).json({ 
                    success: false,
                    error: "Cancellation reason is required" 
               });
          }

          // Check if booking exists
          const booking = await prisma.orders.findUnique({
               where: { id },
               select: { status: true }
          });

          if (!booking) {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          // Don't allow cancellation if already completed
          if (booking.status === 'completed') {
               return res.status(400).json({
                    success: false,
                    error: "Cannot cancel a completed booking"
               });
          }

          const cancelledBooking = await prisma.orders.update({
               where: { id },
               data: {
                    status: "cancelled",
                    cancel_reason: reason,
                    canceled_by: 'admin',
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    status: true,
                    cancel_reason: true,
                    canceled_by: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               success: true,
               message: "Booking cancelled successfully",
               data: cancelledBooking
          });
     } catch (error) {
          console.error("Error cancelling booking:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Process refund (Admin)
 */
const adminProcessRefund = async (req, res) => {
     try {
          const { id } = req.params;
          const { refundAmount, refundReason } = req.body;

          // Check if booking exists
          const booking = await prisma.orders.findUnique({
               where: { id },
               select: {
                    id: true,
                    status: true,
                    total_amount: true,
                    payments: {
                         where: {
                              status: 'paid'
                         },
                         select: {
                              id: true,
                              amount: true,
                              status: true
                         }
                    }
               }
          });

          if (!booking) {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          if (booking.payments.length === 0) {
               return res.status(400).json({
                    success: false,
                    error: "No paid payment found for this booking"
               });
          }

          const payment = booking.payments[0];
          const refundAmountDecimal = refundAmount ? parseFloat(refundAmount) : parseFloat(payment.amount);

          if (refundAmountDecimal > parseFloat(payment.amount)) {
               return res.status(400).json({
                    success: false,
                    error: "Refund amount cannot exceed payment amount"
               });
          }

          // Update payment status to refunded
          const updatedPayment = await prisma.payments.update({
               where: { id: payment.id },
               data: {
                    status: 'refunded'
               }
          });

          // Update booking if needed
          const updatedBooking = await prisma.orders.update({
               where: { id },
               data: {
                    status: booking.status === 'completed' ? booking.status : 'cancelled',
                    cancel_reason: refundReason || 'Refund processed by admin',
                    canceled_by: 'admin',
                    updated_at: new Date()
               }
          });

          res.status(200).json({
               success: true,
               message: "Refund processed successfully",
               data: {
                    booking: updatedBooking,
                    payment: updatedPayment,
                    refundAmount: refundAmountDecimal
               }
          });
     } catch (error) {
          console.error("Error processing refund:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Update admin notes (Admin)
 */
const adminUpdateNotes = async (req, res) => {
     try {
          const { id } = req.params;
          const { notes } = req.body;

          if (notes === undefined || notes === null) {
               return res.status(400).json({ 
                    success: false,
                    error: "Notes field is required" 
               });
          }

          const updatedBooking = await prisma.orders.update({
               where: { id },
               data: {
                    description: notes, // Using description field for admin notes
                    updated_at: new Date()
               },
               select: {
                    id: true,
                    description: true,
                    updated_at: true
               }
          });

          res.status(200).json({
               success: true,
               message: "Notes updated successfully",
               data: updatedBooking
          });
     } catch (error) {
          console.error("Error updating notes:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ 
                    success: false,
                    error: "Booking not found" 
               });
          }

          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Export bookings data (Admin)
 */
const adminExportBookings = async (req, res) => {
     try {
          const { 
               status, 
               paymentStatus, 
               startDate,
               endDate,
               format = 'json' // json or csv
          } = req.query;

          // Build where clause
          const where = {};

          if (status) {
               where.status = status;
          }

          if (paymentStatus) {
               where.payment_completed = paymentStatus === 'paid';
          }

          if (startDate || endDate) {
               where.created_at = {};
               if (startDate) {
                    where.created_at.gte = new Date(startDate);
               }
               if (endDate) {
                    where.created_at.lte = new Date(endDate);
               }
          }

          // Fetch all bookings matching criteria
          const bookings = await prisma.orders.findMany({
               where,
               select: {
                    id: true,
                    status: true,
                    selected_time: true,
                    total_amount: true,
                    payment_completed: true,
                    created_at: true,
                    address: true,
                    description: true,
                    cancel_reason: true,
                    users_orders_client_idTousers: {
                         select: {
                              full_name: true,
                              email: true,
                              phone: true
                         }
                    },
                    users_orders_assigned_worker_idTousers: {
                         select: {
                              full_name: true,
                              email: true,
                              phone: true
                         }
                    },
                    payments: {
                         select: {
                              amount: true,
                              status: true,
                              payment_method: true,
                              trx_id: true,
                              paid_at: true
                         },
                         orderBy: {
                              created_at: 'desc'
                         },
                         take: 1
                    }
               },
               orderBy: {
                    created_at: 'desc'
               }
          });

          if (format === 'csv') {
               // Generate CSV
               const csvHeader = 'Booking ID,User Name,User Email,User Phone,Worker Name,Worker Email,Worker Phone,Status,Scheduled Time,Amount,Payment Status,Payment Method,Transaction ID,Address,Created At\n';
               
               const csvRows = bookings.map(booking => {
                    const user = booking.users_orders_client_idTousers;
                    const worker = booking.users_orders_assigned_worker_idTousers;
                    const payment = booking.payments[0];
                    
                    return [
                         booking.id,
                         user?.full_name || 'N/A',
                         user?.email || 'N/A',
                         user?.phone || 'N/A',
                         worker?.full_name || 'N/A',
                         worker?.email || 'N/A',
                         worker?.phone || 'N/A',
                         booking.status,
                         booking.selected_time || 'N/A',
                         booking.total_amount,
                         booking.payment_completed ? 'Paid' : 'Unpaid',
                         payment?.payment_method || 'N/A',
                         payment?.trx_id || 'N/A',
                         booking.address || 'N/A',
                         booking.created_at
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
               }).join('\n');

               const csv = csvHeader + csvRows;

               res.setHeader('Content-Type', 'text/csv');
               res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
               res.status(200).send(csv);
          } else {
               // Return JSON
               res.status(200).json({
                    success: true,
                    count: bookings.length,
                    exportedAt: new Date().toISOString(),
                    data: bookings
               });
          }
     } catch (error) {
          console.error("Error exporting bookings:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Get booking statistics (Admin)
 */
const adminGetBookingStats = async (req, res) => {
     try {
          const { startDate, endDate } = req.query;

          const where = {};
          if (startDate || endDate) {
               where.created_at = {};
               if (startDate) {
                    where.created_at.gte = new Date(startDate);
               }
               if (endDate) {
                    where.created_at.lte = new Date(endDate);
               }
          }

          // Get counts by status
          const statusCounts = await prisma.orders.groupBy({
               by: ['status'],
               where,
               _count: {
                    status: true
               }
          });

          // Get payment stats
          const paymentStats = await prisma.orders.groupBy({
               by: ['payment_completed'],
               where,
               _count: {
                    payment_completed: true
               },
               _sum: {
                    total_amount: true
               }
          });

          // Get total bookings and revenue
          const totalBookings = await prisma.orders.count({ where });
          const totalRevenue = await prisma.orders.aggregate({
               where: { ...where, payment_completed: true },
               _sum: {
                    total_amount: true
               }
          });

          res.status(200).json({
               success: true,
               data: {
                    totalBookings,
                    totalRevenue: parseFloat(totalRevenue._sum.total_amount || 0),
                    statusCounts: statusCounts.map(s => ({
                         status: s.status,
                         count: s._count.status
                    })),
                    paymentStats: paymentStats.map(p => ({
                         paymentCompleted: p.payment_completed,
                         count: p._count.payment_completed,
                         totalAmount: parseFloat(p._sum.total_amount || 0)
                    }))
               }
          });
     } catch (error) {
          console.error("Error fetching booking stats:", error);
          res.status(500).json({ 
               success: false,
               error: "Internal Server Error",
               message: error.message 
          });
     }
};

/**
 * Get all reviews (Admin)
 */
const adminGetAllReviews = async (req, res) => {
     try {
          const {
               page = 1,
               limit = 10,
               sortBy = 'created_at',
               sortOrder = 'desc'
          } = req.query;

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const take = parseInt(limit);

          // Build where clause
          const where = {};

          // Get total count
          const totalCount = await prisma.reviews.count({ where });

          // Fetch reviews
          const reviews = await prisma.reviews.findMany({
               where,
               skip,
               take,
               select: {
                    id: true, 
                    rating: true,
                    comment: true,
                    created_at: true,
                    users_reviews_user_idTousers: {
                         select: {
                              id: true,
                              full_name: true
                         }
                    },
                    users_reviews_worker_idTousers: {
                         select: {
                              id: true,
                              full_name: true,
                              worker_profiles: {
                                   select: {
                                        avg_rating: true
                                   }
                              }
                         }
                    },
                    orders: {
                         select: {
                              id: true,
                              users_orders_assigned_worker_idTousers: {
                                   select: {
                                        worker_services: {
                                             select: {
                                                  service_categories: {
                                                       select: {
                                                            name: true
                                                       }
                                                  },
                                                  service_sections: {
                                                       select: {
                                                            name: true
                                                       }
                                                  }
                                             }
                                        }
                                   }
                              }
                         }
                    }
               },
               orderBy: {
                    [sortBy]: sortOrder
               }
          });

          // Format response
          const formattedReviews = reviews.map(review => {
               const service = review.orders?.users_orders_assigned_worker_idTousers?.worker_services?.[0];
               
               return {
                    review_id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    user: review.users_reviews_user_idTousers ? {
                         id: review.users_reviews_user_idTousers.id,
                         name: review.users_reviews_user_idTousers.full_name
                    } : null,
                    worker: review.users_reviews_worker_idTousers ? {
                         id: review.users_reviews_worker_idTousers.id,
                         name: review.users_reviews_worker_idTousers.full_name,
                         avg_rating: review.users_reviews_worker_idTousers.worker_profiles?.avg_rating || 0
                    } : null,
                    service: service ? {
                         category: service.service_categories?.name || null,
                         section: service.service_sections?.name || null
                    } : null,
                    booking_id: review.orders?.id || null
               };
          });

          res.status(200).json({
               success: true,
               data: formattedReviews,
               pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
               }
          });
     } catch (error) {
          console.error("Error fetching admin reviews:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

/**
 * Delete a review (Admin)
 */
const adminDeleteReview = async (req, res) => {
     try {
          const { id } = req.params;

          // Check if review exists
          const review = await prisma.reviews.findUnique({
               where: { id }
          });

          if (!review) {
               return res.status(404).json({
                    success: false,
                    error: "Review not found"
               });
          }

          // Delete the review
          await prisma.reviews.delete({
               where: { id }
          });

          res.status(200).json({
               success: true,
               message: "Review deleted successfully"
          });
     } catch (error) {
          console.error("Error deleting review:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

/**
 * Get reviews summary (Admin)
 */
const adminGetReviewsSummary = async (req, res) => {
     try {
          // Get total count of reviews
          const totalReviews = await prisma.reviews.count();

          // Get average rating
          const avgRatingResult = await prisma.reviews.aggregate({
               _avg: {
                    rating: true
               },
               _sum: {
                    rating: true
               }
          });

          // Get count of reviews by rating
          const ratingCounts = await prisma.reviews.groupBy({
               by: ['rating'],
               _count: {
                    rating: true
               }
          });

          // Format rating counts as an object
          const ratingBreakdown = {
               five: 0,
               four: 0,
               three: 0,
               two: 0,
               one: 0
          };

          ratingCounts.forEach(item => {
               if (item.rating === 5) ratingBreakdown.five = item._count.rating;
               else if (item.rating === 4) ratingBreakdown.four = item._count.rating;
               else if (item.rating === 3) ratingBreakdown.three = item._count.rating;
               else if (item.rating === 2) ratingBreakdown.two = item._count.rating;
               else if (item.rating === 1) ratingBreakdown.one = item._count.rating;
          });

          res.status(200).json({
               success: true,
               data: {
                    totalReviews,
                    averageRating: avgRatingResult._avg.rating || 0,
                    totalRating: avgRatingResult._sum.rating || 0,
                    ratingBreakdown: {
                         five: ratingBreakdown.five,
                         four: ratingBreakdown.four,
                         three: ratingBreakdown.three,
                         two: ratingBreakdown.two,
                         one: ratingBreakdown.one
                    }
               }
          });
     } catch (error) {
          console.error("Error fetching reviews summary:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

module.exports = {
     createOrder,
     getOrders,
     getOrderById,
     updateOrderStatus,
     cancelOrder,
     getUserOrder,
     getWorkerHirings,
     getWorkerRequests,
     acceptRequest,
     cancelRequest,
     startWork,
     getStartTime,
     addExtraItem,
     acceptExtraItems,
     getAwaitingWorkDetails,
     // Admin booking management functions
     adminGetAllBookings,
     adminGetBookingById,
     adminUpdateBookingStatus,
     adminAssignWorker,
     adminCancelBooking,
     adminProcessRefund,
     adminUpdateNotes,
     adminExportBookings,
     adminGetBookingStats,
     // Admin review management functions
     adminGetAllReviews,
     adminDeleteReview,
     adminGetReviewsSummary
};


