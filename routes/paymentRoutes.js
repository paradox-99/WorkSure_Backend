const express = require('express');
const router = express.Router();
const { paymentOnHand } = require('../controllers/paymentController');

// Cash payment (payment on hand)
router.post('/cash', paymentOnHand);

module.exports = router;
