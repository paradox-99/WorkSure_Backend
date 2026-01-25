const express = require('express');
const router = express.Router();
const {
    getComplaints,
    getComplaintById,
    updateComplaintStatus
} = require('../controllers/complaintController');

// Get all complaints with optional filters
router.get('/getAllcomplaints', getComplaints);

// Get complaint by ID
router.get('/getComplaintDetailsById/:id', getComplaintById);

// Update complaint status
router.patch('/updatecomplaintStatus/:id', updateComplaintStatus);

module.exports = router;
