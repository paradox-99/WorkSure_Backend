const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

// Create a new order
router.post('/createOrder', createOrder);

// Get all orders with optional filters (client_id, worker_id, status)
router.get('/orders', getOrders);

// Get a specific order by ID
router.get('/orders/:orderId', getOrderById);

// Update order status
router.patch('/orders/:orderId/status', updateOrderStatus);

// Cancel an order
router.delete('/orders/:orderId', cancelOrder);

module.exports = router;
