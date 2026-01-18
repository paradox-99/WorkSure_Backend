const express = require('express');
const router = express.Router();
const { 
     paymentOnHand, 
     verifyPayment,
     initiateSSLPayment,
     sslPaymentSuccess,
     sslPaymentFail,
     sslPaymentCancel,
     sslPaymentIPN
} = require('../controllers/paymentController');

// Cash payment (payment on hand)
router.post('/cash', paymentOnHand);

// Worker verifies payment
router.patch('/verify/:orderId', verifyPayment);

// SSLCommerz payment routes
router.post('/ssl/initiate', initiateSSLPayment);
router.post('/ssl/success/:tran_id', sslPaymentSuccess);
router.post('/ssl/fail/:tran_id', sslPaymentFail);
router.post('/ssl/cancel/:tran_id', sslPaymentCancel);
router.post('/ssl/ipn/:tran_id', sslPaymentIPN);

module.exports = router;
