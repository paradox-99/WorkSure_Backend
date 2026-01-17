const prisma = require("../config/prisma");
const { sendHiringRequestEmail } = require("./mailController");

const createOrder = async (req, res) => {
     const { client_email, worker_id, selected_time, address, description } = req.body;

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
                    payment_completed: false
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
     getStartTime
};


