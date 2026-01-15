const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getUserOrder
} = require('../controllers/orderController');

const { acceptRequest } = require('../controllers/orderController');

// Create a new order
router.post('/createOrder', createOrder);

// Get all orders with optional filters (client_id, worker_id, status)
router.get('/orders', getOrders);

// Get a specific order by ID
router.get('/orders/:orderId', getOrderById);

// Update order status
router.patch('/orders/:orderId/status', updateOrderStatus);

// Cancel an order
router.post('/cancelOrder/:orderId', cancelOrder);
router.get('/orders/user/:email', getUserOrder);

// Worker accepts a pending order
router.post('/orders/:orderId/accept', acceptRequest);

module.exports = router;
