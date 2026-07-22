/**
 * Academic Sessions
 *
 * Manages the full lifecycle of academic sessions — create, activate,
 * complete, archive, and approve. Supports routine versioning with
 * rollback, template application, cross-session analytics comparison,
 * and routine optimization/validation tools.
 */

const express = require('express');
const router = express.Router();
const {
  getSessionDashboard,
  createAcademicSession,
  activateSession,
  completeSession,
  copyRoutineFromSession,
  createRoutineVersion,
  getSessionAnalytics,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  archiveSession,
  approveSession,
  getRoutineVersions,
  rollbackToVersion,
  applyTemplateToSession,
  saveSessionAsTemplate,
  compareSessionAnalytics,
  getCrossSessionAnalytics,
  optimizeSessionRoutine,
  validateSessionRoutine,
  getSessionConflicts
} = require('../controllers/sessionController');

const { protect, requireManagement, optionalAuth } = require('../middleware/auth');

// All session management routes require admin privileges
router.use(protect);
router.use(requireManagement);

// @route   GET /api/sessions/dashboard
// @desc    Get session dashboard with summary counts and key metrics
// @access  Private/Admin
router.get('/dashboard', getSessionDashboard);

// @route   POST /api/sessions/create
// @desc    Create a new academic session
// @access  Private/Admin
router.post('/create', createAcademicSession);

// @route   GET /api/sessions
// @desc    Get all academic sessions with optional filters
// @access  Private/Admin
router.get('/', getAllSessions);

// @route   GET /api/sessions/:id
// @desc    Get academic session by ID
// @access  Private/Admin
router.get('/:id', getSessionById);

// @route   PUT /api/sessions/:id
// @desc    Update academic session details
// @access  Private/Admin
router.put('/:id', updateSession);

// @route   DELETE /api/sessions/:id
// @desc    Delete an academic session
// @access  Private/Admin
router.delete('/:id', deleteSession);

// @route   PUT /api/sessions/:id/activate
// @desc    Activate a session (set as the current active session)
// @access  Private/Admin
router.put('/:id/activate', activateSession);

// @route   PUT /api/sessions/:id/complete
// @desc    Mark session as completed
// @access  Private/Admin
router.put('/:id/complete', completeSession);

// @route   PUT /api/sessions/:id/archive
// @desc    Archive a session (soft-deactivate)
// @access  Private/Admin
router.put('/:id/archive', archiveSession);

// @route   PUT /api/sessions/:id/approve
// @desc    Approve a session's final routine
// @access  Private/Admin
router.put('/:id/approve', approveSession);

// @route   POST /api/sessions/:id/routine/copy-from/:sourceId
// @desc    Copy routine from another session into this session
// @access  Private/Admin
router.post('/:id/routine/copy-from/:sourceId', copyRoutineFromSession);

// @route   PUT /api/sessions/:id/routine/version
// @desc    Create a named version snapshot of the current routine
// @access  Private/Admin
router.put('/:id/routine/version', createRoutineVersion);

// @route   GET /api/sessions/:id/routine/versions
// @desc    Get all routine versions for a session
// @access  Private/Admin
router.get('/:id/routine/versions', getRoutineVersions);

// @route   PUT /api/sessions/:id/routine/rollback/:version
// @desc    Rollback routine to a specific version
// @access  Private/Admin
router.put('/:id/routine/rollback/:version', rollbackToVersion);

// @route   POST /api/sessions/:id/routine/apply-template/:templateId
// @desc    Apply a saved routine template to this session
// @access  Private/Admin
router.post('/:id/routine/apply-template/:templateId', applyTemplateToSession);

// @route   POST /api/sessions/:id/routine/save-as-template
// @desc    Save this session's routine as a reusable template
// @access  Private/Admin
router.post('/:id/routine/save-as-template', saveSessionAsTemplate);

// @route   GET /api/sessions/:id/analytics
// @desc    Get analytics for a specific session
// @access  Private/Admin
router.get('/:id/analytics', getSessionAnalytics);

// @route   GET /api/sessions/:id/analytics/comparison/:compareSessionId
// @desc    Compare analytics between two sessions
// @access  Private/Admin
router.get('/:id/analytics/comparison/:compareSessionId', compareSessionAnalytics);

// @route   GET /api/sessions/analytics/cross-session
// @desc    Get cross-session analytics across all sessions
// @access  Private/Admin
router.get('/analytics/cross-session', getCrossSessionAnalytics);

// @route   POST /api/sessions/:id/routine/optimize
// @desc    Auto-optimize the session's routine for better scheduling
// @access  Private/Admin
router.post('/:id/routine/optimize', optimizeSessionRoutine);

// @route   POST /api/sessions/:id/routine/validate
// @desc    Validate the session's routine for completeness and correctness
// @access  Private/Admin
router.post('/:id/routine/validate', validateSessionRoutine);

// @route   POST /api/sessions/:id/routine/conflicts
// @desc    Detect conflicts within the session's routine
// @access  Private/Admin
router.post('/:id/routine/conflicts', getSessionConflicts);

module.exports = router;
