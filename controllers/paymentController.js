const prisma = require("../config/prisma");
const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true'; // false for sandbox

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

module.exports = {
     paymentOnHand,
     verifyPayment
};
