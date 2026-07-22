/**
 * Time Utilities — time string validation and formatting.
 * Validates HH:MM format, computes duration between two times,
 * converts 24-hour to 12-hour AM/PM display, and produces
 * display-friendly time-range labels for the timetable UI.
 */

/**
 * Validate time format (HH:MM)
 */
function validateTimeFormat(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Calculate time difference in minutes
 */
function calculateTimeDifference(startTime, endTime) {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    throw new Error('Invalid time format. Use HH:MM format.');
  }
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

/**
 * Format time to display format
 */
function formatTimeToDisplay(timeString) {
  if (!validateTimeFormat(timeString)) {
    return timeString;
  }
  
  const [hour, minute] = timeString.split(':');
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Create time slot display name
 */
function createTimeSlotDisplayName(startTime, endTime) {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return `${startTime}-${endTime}`;
  }
  
  return `${formatTimeToDisplay(startTime)}-${formatTimeToDisplay(endTime)}`;
}

module.exports = {
  validateTimeFormat,
  calculateTimeDifference,
  formatTimeToDisplay,
  createTimeSlotDisplayName
};
