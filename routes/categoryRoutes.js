const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Section routes
router.get('/sections', categoryController.getAllSections);
router.get('/categories/:categoryId/sections', categoryController.getSectionsByCategoryId);
router.get('/sections/:id', categoryController.getSectionById);
router.post('/sections', categoryController.createSection);
router.put('/sections/:id', categoryController.updateSection);
router.delete('/sections/:id', categoryController.deleteSection);

module.exports = router;
