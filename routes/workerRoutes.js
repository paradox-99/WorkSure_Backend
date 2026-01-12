const express = require('express');
const router = express.Router();
const {getWorkers, createWorker, createWorkerAvailability, createWorkerService, searchWorkers, updateWorkerProfile,updateWorkerService, updateAvailability, getWorkerDetails, cancelWorkRequest, acceptWorkRequest} = require('../controllers/workerController');

router.get('/workers', getWorkers);
router.get('/getWorkerDetails/:workerId', getWorkerDetails);
router.post('/workers', createWorker);
router.post('/workers/services', createWorkerService);
router.post('/workers/availability', createWorkerAvailability);
router.get('/workers/search', searchWorkers);
router.patch('/updateWorkerProfile', updateWorkerProfile);
router.patch('/updateWorkerService', updateWorkerService);
router.patch('/updateAvailability/:id', updateAvailability);
router.post('/workers/accept-request/:orderId', acceptWorkRequest);
router.patch('/cancelWorkRequest/:id', cancelWorkRequest);

module.exports = router;