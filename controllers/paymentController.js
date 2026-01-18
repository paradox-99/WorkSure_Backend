const prisma = require("../config/prisma");

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
                    status: "paid",
                    paid_at: new Date()
               }
          });

          // Update order payment status
          await prisma.orders.update({
               where: { id: order_id },
               data: {
                    payment_completed: true,
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

module.exports = {
     paymentOnHand
};
