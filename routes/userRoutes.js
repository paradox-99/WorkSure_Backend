const express = require('express');
const router = express.Router();
const {getUsers, createUser, updateAddress, updateUser, getUserData, getUserById} = require('../controllers/userController');

router.get('/users', getUsers);
router.get('/adminGetUserData/:id', getUserById);
router.post('/createUser', createUser);
router.patch('/updateAddress', updateAddress);
router.patch('/updateUser', updateUser);
router.get('/getUserData/:email', getUserData);

module.exports = router;