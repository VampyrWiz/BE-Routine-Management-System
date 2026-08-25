const express = require('express');
const Approval = require('../models/Approval');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');
const { allowRoles, hodOnly } = require('../middleware/roles');

const router = express.Router();

// GET /api/approvals — List approval requests (HoD / DHoD only).
// DHoDs see only requests from their own department by filtering on
// department_code. An optional ?status= query parameter allows filtering
// by 'pending', 'approved', or 'rejected'. Both teacher_id and approved_by
// are populated so the UI can show the requesting teacher's details and
// who acted on the request.
router.get('/', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const filter = {};
    if (req.teacher.role === 'dhod') {
      filter.department_code = req.teacher.department_code;
    }
    if (req.query.status) filter.status = req.query.status;
    const approvals = await Approval.find(filter)
      .populate('teacher_id', 'name email designation department_code')
      .populate('approved_by', 'name');
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/approvals — Submit a new approval request (logged-in teacher).
// Before creating, the handler checks if the teacher already has a pending
// approval request. This prevents duplicate submissions — a teacher must
// wait for the current request to be resolved before sending another.
// The teacher_id is set to the authenticated teacher (req.teacher._id),
// so a teacher cannot submit a request on behalf of someone else.
router.post('/', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id);
    const existingApprovals = await Approval.find({
      teacher_id: req.teacher._id,
      status: 'pending',
    });
    if (existingApprovals.length > 0) {
      return res.status(400).json({ message: 'You already have a pending approval request' });
    }
    const approval = await Approval.create({
      teacher_id: req.teacher._id,
      requested_hours: req.body.requested_hours,
      reason: req.body.reason,
    });
    res.status(201).json(approval);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/approvals/:id/respond — Approve or reject a request (HoD only).
// Validates that status is either 'approved' or 'rejected' (not 'pending').
// On approval, the teacher's max_hours_per_week is updated to the
// requested_hours value, effectively granting the extended limit.
// The HoD's _id is recorded in approved_by for audit trail purposes.
router.put('/:id/respond', protect, hodOnly, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const approval = await Approval.findByIdAndUpdate(
      req.params.id,
      { status, approved_by: req.teacher._id, remarks },
      { new: true }
    );
    if (!approval) return res.status(404).json({ message: 'Approval not found' });

    if (status === 'approved') {
      const teacher = await Teacher.findById(approval.teacher_id);
      if (teacher) {
        teacher.max_hours_per_week = approval.requested_hours;
        await teacher.save();
      }
    }
    res.json(approval);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
