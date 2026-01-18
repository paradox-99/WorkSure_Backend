const prisma = require("../config/prisma");
const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true'; // false for sandbox
const { FRONTEND_URL, BACKEND_URL } = process.env;

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
               cus_name: payer.full_name,
               cus_email: payer.email,
               cus_add1: order.address || 'N/A',
               cus_city: 'Dhaka',
               cus_state: 'Dhaka',
               cus_postcode: '1000',
               cus_country: 'Bangladesh',
               cus_phone: payer.phone,
               ship_name: payer.full_name,
               ship_add1: order.address || 'N/A',
               ship_city: 'Dhaka',
               ship_state: 'Dhaka',
               ship_postcode: '1000',
               ship_country: 'Bangladesh',
          };

          const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
          const apiResponse = await sslcz.init(data);

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
          const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
          const validationResponse = await sslcz.validate({ val_id });

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
          const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
          const validationResponse = await sslcz.validate({ val_id });

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

module.exports = {
     paymentOnHand,
     verifyPayment,
     initiateSSLPayment,
     sslPaymentSuccess,
     sslPaymentFail,
     sslPaymentCancel,
     sslPaymentIPN
};
