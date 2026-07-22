/**
 * Teacher weekly workload utility.
 *
 * Every teacher is allotted a standard teaching load of fifteen hours per week.
 * A class assignment that would push a teacher beyond that standard load, or
 * beyond the teacher's individually configured limit, may be created only by
 * a user holding the HoD (Head of Department) role. The DHoD (Deputy Head of
 * Department) role carries every management privilege except this one, so
 * such an assignment is rejected for a DHoD with a message directing the
 * request to the HoD for approval.
 */

const RoutineSlot = require('../models/RoutineSlot');
const TimeSlot = require('../models/TimeSlot');
const Teacher = require('../models/Teacher');

const STANDARD_WEEKLY_HOURS = 15;

/**
 * Calculates the hours a teacher is already scheduled for within an
 * academic year, optionally excluding a specific slot (used when a slot is
 * being updated rather than newly created).
 */
async function getScheduledWeeklyHours(teacherId, academicYearId, excludeSlotId = null) {
  const query = {
    teacherIds: teacherId,
    academicYearId,
    isActive: true,
    classType: { $ne: 'BREAK' }
  };

  if (excludeSlotId) {
    query._id = { $ne: excludeSlotId };
  }

  const slots = await RoutineSlot.find(query).select('slotIndex').lean();

  if (slots.length === 0) {
    return 0;
  }

  const slotIndexes = [...new Set(slots.map((slot) => slot.slotIndex))];
  const timeSlots = await TimeSlot.find({ _id: { $in: slotIndexes } })
    .select('duration')
    .lean();

  const durationByIndex = new Map(
    timeSlots.map((timeSlot) => [String(timeSlot._id), (timeSlot.duration || 0) / 60])
  );

  return slots.reduce((total, slot) => {
    const hours = durationByIndex.get(String(slot.slotIndex)) || 0;
    return total + hours;
  }, 0);
}

/**
 * Determines whether a proposed class assignment may proceed for a given
 * teacher, given the requesting user's role. Returns an object describing
 * the current load, the projected load, and, when relevant, the reason the
 * assignment was declined.
 */
async function evaluateWorkload({ teacherId, academicYearId, additionalHours, requestingUser, excludeSlotId = null }) {
  const teacher = await Teacher.findById(teacherId).select('maxWeeklyHours fullName').lean();
  const weeklyLimit = (teacher && teacher.maxWeeklyHours) || STANDARD_WEEKLY_HOURS;

  const currentHours = await getScheduledWeeklyHours(teacherId, academicYearId, excludeSlotId);
  const projectedHours = currentHours + additionalHours;

  const withinLimit = projectedHours <= weeklyLimit;
  const isHod = requestingUser && requestingUser.role === 'hod';

  return {
    teacherName: teacher ? teacher.fullName : undefined,
    weeklyLimit,
    currentHours,
    projectedHours,
    allowed: withinLimit || isHod,
    requiresApproval: !withinLimit && !isHod
  };
}

module.exports = {
  STANDARD_WEEKLY_HOURS,
  getScheduledWeeklyHours,
  evaluateWorkload
};
