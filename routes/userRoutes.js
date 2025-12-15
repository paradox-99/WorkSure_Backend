const express = require('express');
const router = express.Router();
const {getUsers, createUser, updateAddress, updateUser} = require('../controllers/userController');

router.get('/users', getUsers);
router.post('/createUser', createUser);
router.put('/updateAddress', updateAddress);
router.put('/updateUser', updateUser);

module.exports = router;