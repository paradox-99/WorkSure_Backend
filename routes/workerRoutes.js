const express = require('express');
const router = express.Router();
const {getWorkers, createWorker, createWorkerAvailability, createWorkerService, searchWorkers, updateWorkerProfile,updateWorkerService, updateAvailability} = require('../controllers/workerController');

router.get('/workers', getWorkers);
router.post('/workers', createWorker);
router.post('/workers/services', createWorkerService);
router.post('/workers/availability', createWorkerAvailability);
router.get('/workers/search', searchWorkers);
router.patch('/updateWorkerProfile', updateWorkerProfile);
router.patch('/updateWorkerService', updateWorkerService);
router.patch('/updateAvailability/:id', updateAvailability);

module.exports = router;