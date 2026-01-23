const express = require('express');
const router = express.Router();
const {getUsers, createUser, updateAddress, updateUser, getUserData, getUserById, suspendUser, activateUser, getUserByEmail} = require('../controllers/userController');

router.get('/users', getUsers);
router.get('/adminGetUserData/:id', getUserById);
router.post('/createUser', createUser);
router.patch('/updateAddress', updateAddress);
router.patch('/updateUser', updateUser);
router.patch('/suspendUser/:id', suspendUser);
router.patch('/activateUser/:id', activateUser);
router.get('/getUserData/:email', getUserData);
router.get('/getUserByEmail/:email', getUserByEmail);

module.exports = router;