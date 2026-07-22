/**
 * Routine Templates
 *
 * Manages reusable routine templates that can be applied to academic
 * sessions. Supports CRUD operations and template analytics. All routes
 * require admin (HoD/DHoD) privileges.
 */

const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateAnalytics
} = require('../controllers/templateController');

const { protect, requireManagement } = require('../middleware/auth');

// All template management routes require admin privileges
router.use(protect);
router.use(requireManagement);

// @route   GET /api/templates
// @desc    Get all routine templates
// @access  Private/Admin
router.get('/', getAllTemplates);

// @route   GET /api/templates/:id
// @desc    Get template details by ID
// @access  Private/Admin
router.get('/:id', getTemplateById);

// @route   POST /api/templates
// @desc    Create a new routine template
// @access  Private/Admin
router.post('/', createTemplate);

// @route   PUT /api/templates/:id
// @desc    Update an existing routine template
// @access  Private/Admin
router.put('/:id', updateTemplate);

// @route   DELETE /api/templates/:id
// @desc    Delete a routine template
// @access  Private/Admin
router.delete('/:id', deleteTemplate);

// @route   GET /api/templates/:id/analytics
// @desc    Get usage analytics for a specific template
// @access  Private/Admin
router.get('/:id/analytics', getTemplateAnalytics);

module.exports = router;
