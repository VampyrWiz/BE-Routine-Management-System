const mongoose = require('mongoose');

// Approval schema — models a teacher's request to exceed their default
// max_hours_per_week. The workflow is:
//   1. A teacher (role = 'teacher') submits a request with requested_hours.
//   2. A HoD reviews it and sets status to 'approved' or 'rejected',
//      recording who approved/rejected via approved_by.
//   3. On approval, the teacher's max_hours_per_week is updated to the
//      requested value, enabling the creation of additional routines.
// teacher_id references the requesting teacher; approved_by references
// the HoD who acted on the request. Both use ObjectId refs so that
// populate() can display names in the approval list UI.
// status defaults to 'pending' and moves to 'approved' or 'rejected'.
const approvalSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  requested_hours: { type: Number, required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
