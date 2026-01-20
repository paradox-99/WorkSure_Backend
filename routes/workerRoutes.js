const express = require('express');
const router = express.Router();
const {getWorkers, createWorker, createWorkerAvailability, createWorkerService, searchWorkers, updateWorkerProfile,updateWorkerService, updateAvailability, getWorkerDetails, getWorkerDashboardSummary, getWorkerDashboardTasks, getWorkerDetailsByEmail, getWorkerById, verifyWorker, suspendWorker, rejectWorker, activateWorker} = require('../controllers/workerController');
const { getWorkerHirings, getWorkerRequests } = require('../controllers/orderController');

router.get('/workers', getWorkers);
router.get('/adminGetWorkerData/:id', getWorkerById);
router.get('/getWorkerDetails/:workerId', getWorkerDetails);
router.patch('/verifyWorker/:workerId', verifyWorker);
router.patch('/suspendWorker/:workerId', suspendWorker);
router.patch('/rejectWorker/:workerId', rejectWorker);
router.patch('/activateWorker/:workerId', activateWorker);

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
router.get('/dashboard/summary/:email', getWorkerDashboardSummary);
router.get('/dashboard/tasks/:email', getWorkerDashboardTasks);
router.get('/dashboard/details/:email', getWorkerDetailsByEmail);

module.exports = router;