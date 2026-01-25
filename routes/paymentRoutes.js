const express = require('express');
const router = express.Router();
const { 
     paymentOnHand, 
     verifyPayment,
     initiateSSLPayment,
     sslPaymentSuccess,
     sslPaymentFail,
     sslPaymentCancel,
     sslPaymentIPN,
     adminRefundPayment,
     getRefundStatus,
     queryRefundStatus,
     adminGetAllRefunds
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

// Admin refund route 
router.post('/refund/:id', adminRefundPayment);

// Refund status routes
router.get('/refund-status/:refundId', getRefundStatus);
router.post('/refund-status-query/:refundId', queryRefundStatus);

// Admin get all refunds
router.get('/admin/refunds', adminGetAllRefunds);

module.exports = router;
