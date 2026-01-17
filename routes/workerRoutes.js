const express = require('express');
const router = express.Router();
const {getWorkers, createWorker, createWorkerAvailability, createWorkerService, searchWorkers, updateWorkerProfile,updateWorkerService, updateAvailability, getWorkerDetails, getWorkerDashboardOverview, getWorkerDetailsByEmail} = require('../controllers/workerController');
const { getWorkerHirings, getWorkerRequests } = require('../controllers/orderController');

router.get('/workers', getWorkers);
router.get('/getWorkerDetails/:workerId', getWorkerDetails);
router.post('/workers', createWorker);
router.post('/workers/services', createWorkerService);
router.post('/workers/availability', createWorkerAvailability);
router.get('/workers/search', searchWorkers);
router.patch('/updateWorkerProfile', updateWorkerProfile);
router.patch('/updateWorkerService', updateWorkerService);
router.patch('/updateAvailability/:id', updateAvailability);
router.get('/hirings/:email', getWorkerHirings);
router.get('/hirings/requests/:email', getWorkerRequests);

// Worker Dashboard Routes
router.get('/dashboard/overview/:email', getWorkerDashboardOverview);
router.get('/dashboard/details/:email', getWorkerDetailsByEmail);

module.exports = router;