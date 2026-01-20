const prisma = require('../config/prisma');

/**
 * Get all categories with sections count
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.service_categories.findMany({
      include: {
        _count: {
          select: { service_sections: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sections_count: category._count.service_sections,
      status: category.status
    }));

    res.status(200).json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get a single category by ID with sections count
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.service_categories.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { service_sections: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sections_count: category._count.service_sections,
      status: category.status
    };

    res.status(200).json({
      success: true,
      data: formattedCategory
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

/**
 * Create a new category
 */
const createCategory = async (req, res) => {
  try {
    const { name, slug, status } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    const category = await prisma.service_categories.create({
      data: {
        name,
        slug,
        status: status || 'active'
      }
    });

    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sections_count: 0,
      status: category.status
    };

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: formattedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * Update a category
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (status !== undefined) updateData.status = status;

    const category = await prisma.service_categories.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: { service_sections: true }
        }
      }
    });

    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sections_count: category._count.service_sections,
      status: category.status
    };

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: formattedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * Delete a category
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service_categories.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * Get all sections for a category with workers count
 */
const getSectionsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const sections = await prisma.service_sections.findMany({
      where: { category_id: parseInt(categoryId) },
      include: {
        _count: {
          select: { worker_services: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedSections = sections.map(section => ({
      id: section.id,
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      workers_count: section._count.worker_services,
      status: section.status
    }));

    res.status(200).json({
      success: true,
      data: formattedSections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sections',
      error: error.message
    });
  }
};

/**
 * Get all sections across all categories
 */
const getAllSections = async (req, res) => {
  try {
    const sections = await prisma.service_sections.findMany({
      include: {
        _count: {
          select: { worker_services: true }
        }
      },
      orderBy: [
        { category_id: 'asc' },
        { name: 'asc' }
      ]
    });

    const formattedSections = sections.map(section => ({
      id: section.id,
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      workers_count: section._count.worker_services,
      status: section.status
    }));

    res.status(200).json({
      success: true,
      data: formattedSections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sections',
      error: error.message
    });
  }
};

/**
 * Get a single section by ID
 */
const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await prisma.service_sections.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { worker_services: true }
        }
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const formattedSection = {
      id: section.id,
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      workers_count: section._count.worker_services,
      status: section.status
    };

    res.status(200).json({
      success: true,
      data: formattedSection
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section',
      error: error.message
    });
  }
};

/**
 * Create a new section
 */
const createSection = async (req, res) => {
  try {
    const { category_id, name, slug, status } = req.body;

    if (!category_id || !name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, name, and slug are required'
      });
    }

    const section = await prisma.service_sections.create({
      data: {
        category_id: parseInt(category_id),
        name,
        slug,
        status: status || 'active'
      }
    });

    const formattedSection = {
      id: section.id,
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      workers_count: 0,
      status: section.status
    };

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: formattedSection
    });
  } catch (error) {
    console.error('Error creating section:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Section with this slug already exists in this category'
      });
    }

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create section',
      error: error.message
    });
  }
};

/**
 * Update a section
 */
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, slug, status } = req.body;

    const updateData = {};
    if (category_id !== undefined) updateData.category_id = parseInt(category_id);
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (status !== undefined) updateData.status = status;

    const section = await prisma.service_sections.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: { worker_services: true }
        }
      }
    });

    const formattedSection = {
      id: section.id,
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      workers_count: section._count.worker_services,
      status: section.status
    };

    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: formattedSection
    });
  } catch (error) {
    console.error('Error updating section:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Section with this slug already exists in this category'
      });
    }

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message
    });
  }
};

/**
 * Delete a section
 */
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service_sections.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting section:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message
    });
  }
};

module.exports = {
  // Category endpoints
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Section endpoints
  getAllSections,
  getSectionsByCategoryId,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
};
