/**
 * Format class type for display
 * @param {string} classType - Class type code (L, P, T)
 * @returns {string} - Full class type name
 */
/** Convert class type code (L/P/T) to human-readable label. */
export const formatClassType = (classType) => {
  const types = {
    'L': 'Lecture',
    'P': 'Practical',
    'T': 'Tutorial'
  };
  return types[classType] || classType;
};

/**
 * Get color for class type
 * @param {string} classType - Class type code (L, P, T)
 * @returns {string} - Color code
 */
/** Return a colour for the given class type. */
export const getClassTypeColor = (classType) => {
  const colors = {
    'L': 'blue',
    'P': 'green',
    'T': 'orange'
  };
  return colors[classType] || 'default';
};

/**
 * Format semester display
 * @param {number} semester - Semester number
 * @returns {string} - Formatted semester
 */
/** Format semester number to display string (e.g. 1 → "1st Semester"). */
export const formatSemester = (semester) => {
  return `Semester ${semester}`;
};

/**
 * Format section display
 * @param {string} section - Section code
 * @returns {string} - Formatted section
 */
/** Uppercase and trim a section string. */
export const formatSection = (section) => {
  return `Section ${section}`;
};

/**
 * Format program display
 * @param {string} code - Program code
 * @param {string} name - Program name
 * @returns {string} - Formatted program
 */
/** Combine program code and name into a display string. */
export const formatProgram = (code, name) => {
  return name ? `${name} (${code})` : code;
};

/**
 * Format teacher display
 * @param {string} fullName - Teacher full name
 * @param {string} shortName - Teacher short name
 * @returns {string} - Formatted teacher
 */
/** Format teacher name for display, preferring short name. */
export const formatTeacher = (fullName, shortName) => {
  return shortName ? `${fullName} (${shortName})` : fullName;
};

/**
 * Format room display
 * @param {string} name - Room name
 * @param {string} building - Building name
 * @param {number} capacity - Room capacity
 * @returns {string} - Formatted room
 */
/** Format room info into a single display string. */
export const formatRoom = (name, building, capacity) => {
  let formatted = name;
  if (building) formatted += ` - ${building}`;
  if (capacity) formatted += ` (Capacity: ${capacity})`;
  return formatted;
};

/**
 * Generate routine grid data structure
 * @param {Object} routineData - Raw routine data from API
 * @param {Array} timeSlots - Time slots array
 * @returns {Object} - Grid data structure
 */
/** Transform flat routine data into a 2D grid indexed by [day][slotId]. */
export const generateRoutineGrid = (routineData, timeSlots) => {
  const grid = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Initialize grid
  dayNames.forEach((_, dayIndex) => {
    grid[dayIndex] = {};
    timeSlots.forEach((_, slotIndex) => {
      grid[dayIndex][slotIndex] = null;
    });
  });
  
  // Populate grid with routine data
  if (routineData && routineData.routine) {
    Object.keys(routineData.routine).forEach(dayIndex => {
      Object.keys(routineData.routine[dayIndex]).forEach(slotIndex => {
        grid[parseInt(dayIndex)][parseInt(slotIndex)] = routineData.routine[dayIndex][slotIndex];
      });
    });
  }
  
  return grid;
};

/**
 * Check if a routine slot is empty
 * @param {Object} slot - Routine slot data
 * @returns {boolean} - True if slot is empty
 */
/** Return true if a grid slot has no scheduled class. */
export const isEmptySlot = (slot) => {
  return !slot || !slot.subjectId;
};

/**
 * Get routine statistics
 * @param {Object} routineData - Raw routine data from API
 * @returns {Object} - Statistics object
 */
/** Compute aggregated stats from routine data (total classes, by type, etc.). */
export const getRoutineStats = (routineData) => {
  if (!routineData || !routineData.routine) {
    return {
      totalClasses: 0,
      classesByDay: {},
      classesByType: { L: 0, P: 0, T: 0 }
    };
  }
  
  const stats = {
    totalClasses: 0,
    classesByDay: {},
    classesByType: { L: 0, P: 0, T: 0 }
  };
  
  // Initialize days
  for (let day = 0; day <= 5; day++) {
    stats.classesByDay[day] = 0;
  }
  
  // Count classes
  Object.keys(routineData.routine).forEach(dayIndex => {
    const daySlots = routineData.routine[dayIndex];
    const classCount = Object.keys(daySlots).length;
    
    stats.classesByDay[parseInt(dayIndex)] = classCount;
    stats.totalClasses += classCount;
    
    // Count by type
    Object.values(daySlots).forEach(slot => {
      if (slot.classType && stats.classesByType.hasOwnProperty(slot.classType)) {
        stats.classesByType[slot.classType]++;
      }
    });
  });
  
  return stats;
};

/**
 * Validate routine slot data
 * @param {Object} slotData - Slot data to validate
 * @returns {Object} - Validation result
 */
/** Validate that a routine slot has required fields (subject, teacher, room). */
export const validateRoutineSlot = (slotData) => {
  const errors = [];
  
  if (!slotData.subjectId) {
    errors.push('Subject is required');
  }
  
  if (!slotData.teacherIds || slotData.teacherIds.length === 0) {
    errors.push('At least one teacher is required');
  }
  
  if (!slotData.roomId) {
    errors.push('Room is required');
  }
  
  if (!slotData.classType) {
    errors.push('Class type is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
