const prisma = require("../config/prisma");

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true'; // false for sandbox
const { FRONTEND_URL, BACKEND_URL } = process.env;

// SSLCommerz API URL
const SSLCOMMERZ_API_URL = is_live 
     ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
     : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

const SSLCOMMERZ_VALIDATION_URL = is_live
     ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
     : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

const paymentOnHand = async (req, res) => {
     const { order_id, payer_email, amount } = req.body;

     try {
          // Validate required fields
          if (!order_id || !payer_email || !amount) {
               return res.status(400).json({ 
                    error: "order_id, payer_email, and amount are required" 
               });
          }

          // Fetch payer_id from users table using payer_email
          const payer = await prisma.users.findUnique({
               where: { email: payer_email },
               select: { id: true }
          });

          if (!payer) {
               return res.status(404).json({ error: "Payer not found with provided email" });
          }

          // Check if order exists
          const order = await prisma.orders.findUnique({
               where: { id: order_id }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Check if order is already paid
          if (order.payment_completed) {
               return res.status(400).json({ error: "Order is already paid" });
          }

          // Create payment record
          const payment = await prisma.payments.create({
               data: {
                    order_id: order_id,
                    payer_id: payer.id,
                    payment_method: "cash",
                    amount: parseFloat(amount),
                    status: "pending",
                    paid_at: new Date()
               }
          });

          // Update order payment status
          await prisma.orders.update({
               where: { id: order_id },
               data: {
                    payment_completed: false,
                    updated_at: new Date()
               }
          });

          res.status(201).json({
               message: "Cash payment recorded successfully",
               payment
          });
     } catch (error) {
          console.error("Error processing cash payment:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order or Payer not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const verifyPayment = async (req, res) => {
     const { orderId } = req.params;

     try {
          // Check if order exists
          const order = await prisma.orders.findUnique({
               where: { id: orderId }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          // Check if order is already paid
          if (order.payment_completed) {
               return res.status(400).json({ error: "Payment already verified" });
          }

          // Find pending payment for this order
          const pendingPayment = await prisma.payments.findFirst({
               where: {
                    order_id: orderId,
                    status: "pending"
               }
          });

          if (!pendingPayment) {
               return res.status(404).json({ error: "No pending payment found for this order" });
          }

          // Update payment status to paid
          await prisma.payments.update({
               where: { id: pendingPayment.id },
               data: {
                    status: "paid",
                    paid_at: new Date()
               }
          });

          // Update order payment_completed to true
          await prisma.orders.update({
               where: { id: orderId },
               data: {
                    payment_completed: true,
                    updated_at: new Date()
               }
          });

          res.status(200).json({
               message: "Payment verified successfully"
          });
     } catch (error) {
          console.error("Error verifying payment:", error);

          if (error.code === "P2025") {
               return res.status(404).json({ error: "Order or Payment not found" });
          }

          res.status(500).json({ error: "Internal Server Error" });
     }
};

const initiateSSLPayment = async (req, res) => {
     const { order_id, payer_email } = req.body;

     try {
          // Validate SSLCommerz credentials
          if (!store_id || !store_passwd) {
               console.error("SSLCommerz credentials missing:", { store_id: !!store_id, store_passwd: !!store_passwd });
               return res.status(500).json({
                    error: "Payment gateway configuration error"
               });
          }

          // Validate required fields
          if (!order_id || !payer_email) {
               return res.status(400).json({
                    error: "order_id and payer_email are required"
               });
          }

          // Fetch payer details
          const payer = await prisma.users.findUnique({
               where: { email: payer_email },
               select: { id: true, full_name: true, phone: true, email: true }
          });

          if (!payer) {
               return res.status(404).json({ error: "Payer not found with provided email" });
          }

          // Fetch order with details
          const order = await prisma.orders.findUnique({
               where: { id: order_id },
               include: {
                    order_items: true
               }
          });

          if (!order) {
               return res.status(404).json({ error: "Order not found" });
          }

          if (order.payment_completed) {
               return res.status(400).json({ error: "Order is already paid" });
          }

          // Calculate total amount including extra items
          let totalAmount = parseFloat(order.total_amount || 0);

          // Validate amount
          if (!totalAmount || totalAmount <= 0) {
               return res.status(400).json({
                    error: "Invalid order amount. Amount must be greater than 0"
               });
          }

          // Validate phone number (SSLCommerz requires valid phone)
          const phoneNumber = payer.phone || '01700000000';
          
          // Generate unique transaction ID
          const tran_id = `TRX_${order_id}_${Date.now()}`;

          // Create pending payment record
          const payment = await prisma.payments.create({
               data: {
                    order_id: order_id,
                    payer_id: payer.id,
                    payment_method: "sslcommerz",
                    trx_id: tran_id,
                    amount: totalAmount,
                    status: "pending"
               }
          });

          const data = {
               total_amount: totalAmount,
               currency: 'BDT',
               tran_id: tran_id,
               success_url: `${BACKEND_URL}/api/paymentRoutes/ssl/success/${tran_id}`,
               fail_url: `${BACKEND_URL}/api/paymentRoutes/ssl/fail/${tran_id}`,
               cancel_url: `${BACKEND_URL}/api/paymentRoutes/ssl/cancel/${tran_id}`,
               ipn_url: `${BACKEND_URL}/api/paymentRoutes/ssl/ipn/${tran_id}`,
               shipping_method: 'NO',
               product_name: 'WorkSure Service',
               product_category: 'Service',
               product_profile: 'general',
               cus_name: payer.full_name || 'Customer',
               cus_email: payer.email,
               cus_add1: order.address || 'N/A',
               cus_city: 'Dhaka',
               cus_state: 'Dhaka',
               cus_postcode: '1000',
               cus_country: 'Bangladesh',
               cus_phone: phoneNumber,
               ship_name: payer.full_name || 'Customer',
               ship_add1: order.address || 'N/A',
               ship_city: 'Dhaka',
               ship_state: 'Dhaka',
               ship_postcode: '1000',
               ship_country: 'Bangladesh',
               store_id: store_id,
               store_passwd: store_passwd,
          };

          console.log("SSLCommerz Request Data:", JSON.stringify(data, null, 2));

          // Make direct API call to SSLCommerz
          const formData = new URLSearchParams();
          Object.keys(data).forEach(key => {
               formData.append(key, data[key]);
          });

          let apiResponse;
          try {
               const response = await fetch(SSLCOMMERZ_API_URL, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
               });

               const responseText = await response.text();
               console.log("SSLCommerz Raw Response:", responseText);

               try {
                    apiResponse = JSON.parse(responseText);
               } catch (parseError) {
                    console.error("SSLCommerz returned non-JSON response:", responseText);
                    await prisma.payments.delete({ where: { id: payment.id } });
                    return res.status(502).json({
                         error: "Payment gateway returned invalid response. Please verify SSLCommerz credentials.",
                         details: responseText.substring(0, 200)
                    });
               }
          } catch (initError) {
               console.error("SSLCommerz init error:", initError);
               await prisma.payments.delete({ where: { id: payment.id } });
               return res.status(502).json({ 
                    error: "Payment gateway error. Please check your SSLCommerz credentials and try again." 
               });
          }
          
          console.log("SSLCommerz Response:", apiResponse);
          

          if (apiResponse?.GatewayPageURL) {
               res.status(200).json({
                    message: "Payment initiated successfully",
                    paymentUrl: apiResponse.GatewayPageURL,
                    tran_id: tran_id
               });
          } else {
               // Delete the pending payment if initialization fails
               await prisma.payments.delete({ where: { id: payment.id } });
               res.status(400).json({ error: "Failed to initiate payment" });
          }
     } catch (error) {
          console.error("Error initiating SSL payment:", error);
          res.status(500).json({ error: "Internal Server Error" });
     }
};

const sslPaymentSuccess = async (req, res) => {
     const { tran_id, val_id, status } = req.body;


     try {
          if (status !== 'VALID') {
               return res.redirect(`${FRONTEND_URL}/payment/failed`);
          }

          // Find payment by transaction ID
          const payment = await prisma.payments.findFirst({
               where: { trx_id: tran_id }
          });

          if (!payment) {
               return res.redirect(`${FRONTEND_URL}/payment/failed`);
          }

          // Validate the transaction with SSLCommerz
          const validationUrl = `${SSLCOMMERZ_VALIDATION_URL}?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`;
          const validationRes = await fetch(validationUrl);
          const validationResponse = await validationRes.json();

          if (validationResponse.status === 'VALID' || validationResponse.status === 'VALIDATED') {
               // Update payment status
               await prisma.payments.update({
                    where: { id: payment.id },
                    data: {
                         status: "paid",
                         paid_at: new Date()
                    }
               });

               // Update order payment_completed
               await prisma.orders.update({
                    where: { id: payment.order_id },
                    data: {
                         payment_completed: true,
                         updated_at: new Date()
                    }
               });

               return res.redirect(`${FRONTEND_URL}/payment/success`);
          } else {
               return res.redirect(`${FRONTEND_URL}/payment/failed`);
          }
     } catch (error) {
          console.error("Error processing SSL payment success:", error);
          return res.redirect(`${FRONTEND_URL}/payment/failed`);
     }
};

const sslPaymentFail = async (req, res) => {
     const { tran_id } = req.params;

     try {
          // Find and update payment status to failed
          const payment = await prisma.payments.findFirst({
               where: { trx_id: tran_id }
          });

          if (payment) {
               await prisma.payments.update({
                    where: { id: payment.id },
                    data: { status: "failed" }
               });
          }

          return res.redirect(`${FRONTEND_URL}/payment/failed`);
     } catch (error) {
          console.error("Error processing SSL payment failure:", error);
          return res.redirect(`${FRONTEND_URL}/payment/failed`);
     }
};

const sslPaymentCancel = async (req, res) => {
     const { tran_id } = req.params;

     try {
          // Find and update payment status to cancelled
          const payment = await prisma.payments.findFirst({
               where: { trx_id: tran_id }
          });

          if (payment) {
               await prisma.payments.update({
                    where: { id: payment.id },
                    data: { status: "cancelled" }
               });
          }

          return res.redirect(`${FRONTEND_URL}/payment/cancelled`);
     } catch (error) {
          console.error("Error processing SSL payment cancellation:", error);
          return res.redirect(`${FRONTEND_URL}/payment/cancelled`);
     }
};

const sslPaymentIPN = async (req, res) => {
     const { tran_id, val_id, status } = req.body;

     try {
          if (status !== 'VALID') {
               return res.status(200).json({ message: "IPN received - invalid status" });
          }

          const payment = await prisma.payments.findFirst({
               where: { trx_id: tran_id }
          });

          if (!payment || payment.status === 'paid') {
               return res.status(200).json({ message: "IPN received - already processed or not found" });
          }

          // Validate with SSLCommerz
          const validationUrl = `${SSLCOMMERZ_VALIDATION_URL}?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`;
          const validationRes = await fetch(validationUrl);
          const validationResponse = await validationRes.json();

          if (validationResponse.status === 'VALID' || validationResponse.status === 'VALIDATED') {
               await prisma.payments.update({
                    where: { id: payment.id },
                    data: {
                         status: "paid",
                         paid_at: new Date()
                    }
               });

               await prisma.orders.update({
                    where: { id: payment.order_id },
                    data: {
                         payment_completed: true,
                         updated_at: new Date()
                    }
               });
          }

          return res.status(200).json({ message: "IPN processed successfully" });
     } catch (error) {
          console.error("Error processing SSL IPN:", error);
          return res.status(200).json({ message: "IPN received with error" });
     }
};

/**
 * Get all payments (Admin)
 */
const adminGetAllPayments = async (req, res) => {
     try {
          const {
               page = 1,
               limit = 10,
               status,
               paymentMethod,
               dateFrom,
               dateTo,
               sortBy = 'created_at',
               sortOrder = 'desc'
          } = req.query;

          console.log(req.query);
          

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const take = parseInt(limit);

          // Build where clause
          const where = {};

          if (status) {
               where.status = status;
          }

          if (paymentMethod) {
               where.payment_method = paymentMethod;
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
          const totalCount = await prisma.payments.count({ where });

          // Fetch payments
          const payments = await prisma.payments.findMany({
               where,
               skip,
               take,
               select: {
                    id: true,
                    amount: true,
                    status: true,
                    payment_method: true,
                    trx_id: true,
                    paid_at: true,
                    created_at: true,
                    orders: {
                         select: {
                              id: true,
                              status: true,
                              users_orders_client_idTousers: {
                                   select: {
                                        id: true,
                                        full_name: true,
                                        email: true
                                   }
                              }
                         }
                    },
                    users: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true
                         }
                    }
               },
               orderBy: {
                    [sortBy]: sortOrder
               }
          });

          // Format response
          const formattedPayments = payments.map(payment => ({
               payment_id: payment.id,
               amount: parseFloat(payment.amount),
               status: payment.status,
               payment_method: payment.payment_method,
               transaction_id: payment.trx_id,
               payer: payment.users ? {
                    id: payment.users.id,
                    name: payment.users.full_name,
                    email: payment.users.email
               } : null,
               booking: payment.orders ? {
                    id: payment.orders.id,
                    status: payment.orders.status,
                    client: payment.orders.users_orders_client_idTousers ? {
                         id: payment.orders.users_orders_client_idTousers.id,
                         name: payment.orders.users_orders_client_idTousers.full_name,
                         email: payment.orders.users_orders_client_idTousers.email
                    } : null
               } : null,
               paid_at: payment.paid_at,
               created_at: payment.created_at
          }));

          res.status(200).json({
               success: true,
               data: formattedPayments,
               pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
               }
          });
     } catch (error) {
          console.error("Error fetching admin payments:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

/**
 * Get payment details (Admin)
 */
const adminGetPaymentDetails = async (req, res) => {
     try {
          const { id } = req.params;

          const payment = await prisma.payments.findUnique({
               where: { id },
               select: {
                    id: true,
                    amount: true,
                    status: true,
                    payment_method: true,
                    trx_id: true,
                    paid_at: true,
                    created_at: true,
                    orders: {
                         select: {
                              id: true,
                              status: true,
                              total_amount: true,
                              description: true,
                              address: true,
                              selected_time: true,
                              created_at: true,
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
                                                  avg_rating: true
                                             }
                                        }
                                   }
                              }
                         }
                    },
                    users: {
                         select: {
                              id: true,
                              full_name: true,
                              email: true,
                              phone: true
                         }
                    }
               }
          });

          if (!payment) {
               return res.status(404).json({
                    success: false,
                    error: "Payment not found"
               });
          }

          res.status(200).json({
               success: true,
               payment
          });
     } catch (error) {
          console.error("Error fetching payment details:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

/**
 * Get payments summary (Admin)
 */
const adminGetPaymentsSummary = async (req, res) => {
     try {
          const { dateFrom, dateTo } = req.query;

          const where = {};

          if (dateFrom || dateTo) {
               where.created_at = {};
               if (dateFrom) {
                    where.created_at.gte = new Date(dateFrom);
               }
               if (dateTo) {
                    where.created_at.lte = new Date(dateTo);
               }
          }

          // Get total payments count
          const totalPayments = await prisma.payments.count({ where });

          // Get total revenue
          const revenueResult = await prisma.payments.aggregate({
               where: { ...where, status: 'paid' },
               _sum: {
                    amount: true
               }
          });

          // Get payment status breakdown
          const statusBreakdown = await prisma.payments.groupBy({
               by: ['status'],
               where,
               _count: {
                    status: true
               },
               _sum: {
                    amount: true
               }
          });

          // Get payment method breakdown
          const methodBreakdown = await prisma.payments.groupBy({
               by: ['payment_method'],
               where,
               _count: {
                    payment_method: true
               },
               _sum: {
                    amount: true
               }
          });

          // Format status breakdown
          const formattedStatusBreakdown = statusBreakdown.reduce((acc, item) => {
               acc[item.status] = {
                    count: item._count.status,
                    total: parseFloat(item._sum.amount || 0)
               };
               return acc;
          }, {});

          // Format method breakdown
          const formattedMethodBreakdown = methodBreakdown.reduce((acc, item) => {
               acc[item.payment_method] = {
                    count: item._count.payment_method,
                    total: parseFloat(item._sum.amount || 0)
               };
               return acc;
          }, {});

          res.status(200).json({
               success: true,
               data: {
                    totalPayments,
                    totalRevenue: parseFloat(revenueResult._sum.amount || 0),
                    statusBreakdown: formattedStatusBreakdown,
                    methodBreakdown: formattedMethodBreakdown
               }
          });
     } catch (error) {
          console.error("Error fetching payments summary:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

/**
 * Refund payment / Admin action (Admin)
 */
const adminRefundPayment = async (req, res) => {
     try {
          const { id } = req.params;
          const { refundAmount, refundReason } = req.body;

          // Validate required fields
          if (!refundReason) {
               return res.status(400).json({
                    success: false,
                    error: "Refund reason is required"
               });
          }

          // Get payment details
          const payment = await prisma.payments.findUnique({
               where: { id },
               select: {
                    id: true,
                    amount: true,
                    status: true,
                    order_id: true
               }
          });

          if (!payment) {
               return res.status(404).json({
                    success: false,
                    error: "Payment not found"
               });
          }

          if (payment.status !== 'paid') {
               return res.status(400).json({
                    success: false,
                    error: "Only paid payments can be refunded"
               });
          }

          const refundAmountDecimal = refundAmount ? parseFloat(refundAmount) : parseFloat(payment.amount);

          if (refundAmountDecimal > parseFloat(payment.amount)) {
               return res.status(400).json({
                    success: false,
                    error: "Refund amount cannot exceed payment amount"
               });
          }

          // Update payment status to refunded
          const updatedPayment = await prisma.payments.update({
               where: { id },
               data: {
                    status: 'refunded',
                    paid_at: new Date()
               },
               select: {
                    id: true,
                    amount: true,
                    status: true,
                    payment_method: true
               }
          });

          // Update order payment status if full refund
          if (refundAmountDecimal === parseFloat(payment.amount) && payment.order_id) {
               await prisma.orders.update({
                    where: { id: payment.order_id },
                    data: {
                         payment_completed: false,
                         updated_at: new Date()
                    }
               });
          }

          res.status(200).json({
               success: true,
               message: `Payment refunded successfully. Refund amount: ${refundAmountDecimal}`,
               data: {
                    payment_id: updatedPayment.id,
                    refund_amount: refundAmountDecimal,
                    reason: refundReason,
                    payment_status: updatedPayment.status
               }
          });
     } catch (error) {
          console.error("Error refunding payment:", error);
          res.status(500).json({
               success: false,
               error: "Internal Server Error",
               message: error.message
          });
     }
};

module.exports = {
     paymentOnHand,
     verifyPayment,
     initiateSSLPayment,
     sslPaymentSuccess,
     sslPaymentFail,
     sslPaymentCancel,
     sslPaymentIPN,
     // Admin payment management functions
     adminGetAllPayments,
     adminGetPaymentDetails,
     adminGetPaymentsSummary,
     adminRefundPayment
};
