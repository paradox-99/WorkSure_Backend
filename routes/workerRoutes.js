const express = require('express');
const router = express.Router();
const {getWorkers, searchWorkers} = require('../controllers/workerController');

router.get('/workers', getWorkers);
router.get('/workers/search', searchWorkers);

module.exports = router;