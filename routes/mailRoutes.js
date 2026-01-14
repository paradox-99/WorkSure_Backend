const express = require('express');
const router = express.Router();
const { sendTest } = require('../controllers/mailController');

router.post('/send-test', sendTest);

module.exports = router;
