const express = require('express');
const router = express.Router();
const {getUsers, createUser, updateAddress, updateUser, getUserData, getUserById, suspendUser, activateUser, getUserByEmail, checkWorkerAvailability, createReview, createComplaint} = require('../controllers/userController');

router.get('/users', getUsers);
router.get('/adminGetUserData/:id', getUserById);
router.post('/createUser', createUser);
router.patch('/updateAddress', updateAddress);
router.patch('/updateUser', updateUser);
router.patch('/suspendUser/:id', suspendUser);
router.patch('/activateUser/:id', activateUser);
router.get('/getUserData/:email', getUserData);
router.get('/getUserByEmail/:email', getUserByEmail);
router.post('/checkWorkerAvailability', checkWorkerAvailability);
router.post('/createReview', createReview);
router.post('/createComplaint', createComplaint);

module.exports = router;