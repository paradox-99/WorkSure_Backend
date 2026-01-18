const express = require('express');
const router = express.Router();
const { paymentOnHand, verifyPayment } = require('../controllers/paymentController');

// Cash payment (payment on hand)
router.post('/cash', paymentOnHand);

// Worker verifies payment
router.patch('/verify/:orderId', verifyPayment);

module.exports = router;
