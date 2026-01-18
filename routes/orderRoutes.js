const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getUserOrder,
  startWork,
  getStartTime,
  addExtraItem,
  acceptExtraItems,
  getAwaitingWorkDetails
} = require('../controllers/orderController');

const { acceptRequest, cancelRequest } = require('../controllers/orderController');

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
router.patch('/acceptWorkRequest/:orderId', acceptRequest);

// Worker cancels a work request
router.patch('/cancelWorkRequest/:orderId', cancelRequest);

// Worker starts work on an accepted order
router.patch('/startWork/:orderId', startWork);
router.get('/getStartTime/:orderId', getStartTime);

// Add extra item to an order
router.post('/orderItems/:orderId', addExtraItem);

// User accepts extra items for an order
router.patch('/orderItems/:orderId/accept', acceptExtraItems);

// Get awaiting work details with total price and extra items price
router.get('/orders/:orderId/awaitingDetails', getAwaitingWorkDetails);

module.exports = router;
