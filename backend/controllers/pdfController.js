/**
 * PDF Controller
 *
 * Exports timetable data as PDF documents.  Supports class routines,
 * individual/all teacher schedules, individual/all room schedules,
 * workload reports and utilisation reports.  All generation is
 * delegated to the UnifiedPDFService.
 */
const UnifiedPDFService = require('../services/UnifiedPDFService');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const RoutineSlot = require('../models/RoutineSlot');

/**
 * Build a teacher's weekly schedule object (same shape as the class-
 * routine endpoint) for PDF rendering.  Fetches all active slots where
 * the teacher is assigned, regardless of academic year, so the PDF
 * always shows the complete picture.
 */
const getTeacherScheduleData = async (teacherId, academicYearId) => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  // Get current academic year if not specified
  let academicYear;
  if (academicYearId) {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findById(academicYearId);
  } else {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findOne({ isCurrentYear: true });
  }

  // If no academic year found, return empty schedule
  if (!academicYear) {
    return {
      teacherId: teacher._id,
      fullName: teacher.fullName,
      shortName: teacher.shortName,
      programCode: 'TEACHER_VIEW',
      semester: 'ALL',
      section: 'ALL',
      routine: {
        0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}
      },
      message: 'No current academic year set. Please set an academic year to view schedules.'
    };
  }

  // Get all routine slots for this teacher (matching teacherController logic)
  const routineSlots = await RoutineSlot.find({
    teacherIds: teacher._id,
    isActive: true
  }).populate([
    { path: 'programId', select: 'code name' },
    { path: 'subjectId', select: 'code name weeklyHours' },
    { path: 'roomId', select: 'name building' },
    { path: 'labGroupId', select: 'groups' }
  ]).sort({ dayIndex: 1, slotIndex: 1 }).lean();

  // Create routine object with day indices as keys and slot indices as sub-keys
  const routine = {};
  
  // Initialize routine object for all days (0-6 = Sunday to Saturday)
  for (let day = 0; day <= 6; day++) {
    routine[day] = {};
  }

  // Populate routine with classes using the EXACT SAME structure as class routine
  routineSlots.forEach(slot => {
    const slotData = {
      _id: slot._id,
      subjectId: slot.subjectId?._id,
      subjectName: slot.subjectName_display || slot.subjectId?.name || 'Unknown Subject',
      subjectCode: slot.subjectCode_display || slot.subjectId?.code || 'N/A',
      teacherIds: slot.teacherIds,
      teacherNames: slot.teacherNames_display || slot.teacherIds?.map(t => t.fullName) || [teacher.fullName],
      teacherShortNames: slot.teacherShortNames_display || slot.teacherIds?.map(t => t.shortName) || [teacher.shortName],
      roomId: slot.roomId?._id,
      roomName: slot.roomName_display || slot.roomId?.name || 'TBA',
      classType: slot.classType,
      notes: slot.notes,
      timeSlot_display: slot.timeSlot_display || '',
      spanId: slot.spanId,
      spanMaster: slot.spanMaster,
      programCode: slot.programCode,
      semester: slot.semester,
      section: slot.section,
      programSemesterSection: `${slot.programCode} Sem${slot.semester} ${slot.section}`,
      labGroupName: slot.labGroupName,
      recurrence: slot.recurrence,
      isElectiveClass: slot.isElectiveClass || false,
      classCategory: slot.classCategory || 'CORE',
      electiveInfo: slot.electiveInfo || null,
      labGroup: slot.labGroup,
      isAlternativeWeek: slot.isAlternativeWeek,
      alternateGroupData: slot.alternateGroupData
    };
    
    // Handle multiple slots in the same time slot
    if (routine[slot.dayIndex][slot.slotIndex]) {
      const existing = routine[slot.dayIndex][slot.slotIndex];
      if (Array.isArray(existing)) {
        existing.push(slotData);
      } else {
        routine[slot.dayIndex][slot.slotIndex] = [existing, slotData];
      }
    } else {
      routine[slot.dayIndex][slot.slotIndex] = slotData;
    }
  });

  return {
    teacherId: teacher._id,
    fullName: teacher.fullName,
    shortName: teacher.shortName,
    programCode: 'TEACHER_VIEW',
    semester: 'ALL',
    section: 'ALL',
    routine
  };
};

/**
 * Build a room's weekly schedule object for PDF rendering.  Fetches all
 * active slots assigned to this room so the PDF reflects the complete
 * occupancy picture.
 */
const getRoomScheduleData = async (roomId, academicYearId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Get current academic year if not specified
  let academicYear;
  if (academicYearId) {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findById(academicYearId);
  } else {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findOne({ isCurrentYear: true });
  }

  // If no academic year found, return empty schedule
  if (!academicYear) {
    return {
      roomId: room._id,
      roomName: room.name,
      building: room.building,
      programCode: 'ROOM_VIEW',
      semester: 'ALL',
      section: 'ALL',
      routine: {
        0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}
      },
      message: 'No current academic year set. Please set an academic year to view schedules.'
    };
  }

  // Get all routine slots for this room
  const routineSlots = await RoutineSlot.find({
    roomId: room._id,
    isActive: true
  }).populate([
    { path: 'programId', select: 'code name' },
    { path: 'subjectId', select: 'code name weeklyHours' },
    { path: 'teacherIds', select: 'fullName shortName' },
    { path: 'labGroupId', select: 'groups' }
  ]).sort({ dayIndex: 1, slotIndex: 1 });

  // Create routine object with day indices as keys and slot indices as sub-keys
  const routine = {};
  
  // Initialize routine object for all days (0-6 = Sunday to Saturday)
  for (let day = 0; day <= 6; day++) {
    routine[day] = {};
  }

  // Populate routine with classes
  routineSlots.forEach(slot => {
    const slotData = {
      _id: slot._id,
      subjectId: slot.subjectId?._id,
      subjectName: slot.subjectName_display || slot.subjectId?.name || 'Unknown Subject',
      subjectCode: slot.subjectCode_display || slot.subjectId?.code || 'N/A',
      teacherIds: slot.teacherIds,
      teacherNames: slot.teacherNames_display || slot.teacherIds?.map(t => t.fullName) || [],
      teacherShortNames: slot.teacherShortNames_display || slot.teacherIds?.map(t => t.shortName) || [],
      roomId: slot.roomId?._id,
      roomName: slot.roomName_display || slot.roomId?.name || room.name,
      classType: slot.classType,
      notes: slot.notes,
      timeSlot_display: slot.timeSlot_display || '',
      spanId: slot.spanId,
      spanMaster: slot.spanMaster,
      programCode: slot.programCode,
      semester: slot.semester,
      section: slot.section,
      programSemesterSection: `${slot.programCode} Sem${slot.semester} ${slot.section}`,
      labGroupName: slot.labGroupName,
      recurrence: slot.recurrence,
      isElectiveClass: slot.isElectiveClass || false,
      classCategory: slot.classCategory || 'CORE',
      electiveInfo: slot.electiveInfo || null,
      labGroup: slot.labGroup,
      isAlternativeWeek: slot.isAlternativeWeek,
      alternateGroupData: slot.alternateGroupData
    };
    
    // Handle multiple slots in the same time slot
    if (routine[slot.dayIndex][slot.slotIndex]) {
      const existing = routine[slot.dayIndex][slot.slotIndex];
      if (Array.isArray(existing)) {
        existing.push(slotData);
      } else {
        routine[slot.dayIndex][slot.slotIndex] = [existing, slotData];
      }
    } else {
      routine[slot.dayIndex][slot.slotIndex] = slotData;
    }
  });

  return {
    roomId: room._id,
    roomName: room.name,
    building: room.building,
    programCode: 'ROOM_VIEW',
    semester: 'ALL',
    section: 'ALL',
    routine
  };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     PDFExportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         filename:
 *           type: string
 */

/**
 * @desc    Export a single section's class routine to PDF
 * @route   GET /api/pdf/routine/export
 * @access  Public
 *
 * Generates a downloadable PDF timetable for the given program, semester
 * and section by delegating to UnifiedPDFService.
 */
const exportRoutineToPDF = async (req, res) => {
  try {
    const { programCode, semester, section } = req.query;

    // Validate required parameters
    if (!programCode || !semester || !section) {
      return res.status(400).json({
        success: false,
        message: 'Program code, semester, and section are required'
      });
    }


    // Use unified PDF service with time slot fix
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateClassSchedulePDF(programCode, semester, section);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No routine data found for the specified program/semester/section'
      });
    }

    // Set response headers for PDF download
    const fileName = `${programCode.toUpperCase()}_Sem${semester}_${section.toUpperCase()}_Routine_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export a single teacher's weekly schedule to PDF
 * @route   GET /api/pdf/teacher/:teacherId/export
 * @access  Public
 */
const exportTeacherScheduleToPDF = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, semesterGroup = 'all' } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }


    // Get teacher information
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Use the unified PDF service with time slot fix
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateTeacherSchedulePDF(teacherId, teacher.fullName, semesterGroup);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this teacher'
      });
    }

    // Set response headers
    const fileName = `${teacher.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Teacher schedule PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate teacher schedule PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export schedules for all active teachers to a single PDF
 * @route   GET /api/pdf/teacher/export/all
 * @access  Public
 */
const exportAllTeachersSchedulesToPDF = async (req, res) => {
  try {
    const { academicYear, semesterGroup = 'all' } = req.query;


    // Use the unified PDF service with time slot fix
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateAllTeachersSchedulesPDF(semesterGroup);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No teacher schedule data found'
      });
    }

    // Set response headers
    const groupSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `All_Teachers_Schedules${groupSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ All teachers schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate all teachers schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export a single room's weekly schedule to PDF
 * @route   GET /api/pdf/room/:roomId/export
 * @access  Public
 */
const exportRoomScheduleToPDF = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { academicYear } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }


    // Get room information
    const Room = require('../models/Room');
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Use the unified PDF service with time slot fix
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateRoomSchedulePDF(roomId, room.name);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this room'
      });
    }

    // Set response headers
    const fileName = `${room.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Room schedule PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room schedule PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export schedules for all rooms to a single PDF
 * @route   GET /api/pdf/room/export/all
 * @access  Public
 */
const exportAllRoomSchedulesToPDF = async (req, res) => {
  try {
    const { academicYear } = req.query;


    // Use the unified PDF service with time slot fix
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateAllRoomsSchedulePDF();

    // Set response headers
    const fileName = `All_Room_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ All room schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate all room schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export a teacher's workload report to PDF
 * @route   GET /api/pdf/teacher/workload/:teacherId
 * @access  Public
 *
 * Reuses the teacher-schedule PDF generation as a proxy for workload
 * analysis (the schedule data effectively shows the workload).
 */
const exportTeacherWorkloadReport = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { semesterGroup = 'all' } = req.query;

    // Get teacher information
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Use unified service for teacher schedule (workload analysis can be derived from schedule)
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateTeacherSchedulePDF(teacherId, teacher.fullName, semesterGroup);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this teacher'
      });
    }

    // Set response headers
    const fileName = `${teacher.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Workload_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Teacher workload report PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate teacher workload report PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export a room's utilisation report to PDF
 * @route   GET /api/pdf/room/utilization/:roomId
 * @access  Public
 *
 * Reuses the room-schedule PDF generation as a proxy for utilisation
 * analysis.
 */
const exportRoomUtilizationReport = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get room information
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Use unified service for room schedule (utilization can be derived from schedule)
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateRoomSchedulePDF(roomId, room.name);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this room'
      });
    }

    // Set response headers
    const fileName = `${room.name.replace(/[^a-zA-Z0-9]/g, '_')}_Utilization_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Room utilization report PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room utilization report PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export schedules for all rooms in a building to PDF
 * @route   GET /api/pdf/building/:buildingId/rooms/export
 * @access  Public
 *
 * Currently delegates to the all-rooms PDF (building-level filtering is
 * not yet implemented at the service layer).
 */
const exportBuildingRoomsSchedulesToPDF = async (req, res) => {
  try {
    const { buildingId } = req.params;

    // For now, use the all rooms export (can be enhanced later to filter by building)
    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateAllRoomsSchedulePDF();

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No room schedule data found'
      });
    }

    // Set response headers
    const fileName = `Building_${buildingId}_Rooms_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Building rooms schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate building rooms schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export all teachers' schedules (enhanced version)
 * @route   GET /api/pdf/teachers/export/enhanced
 * @access  Public
 *
 * Same underlying logic as exportAllTeachersSchedulesToPDF but exposed
 * under a separate route for backward compatibility.
 */
const exportEnhancedAllTeachersSchedules = async (req, res) => {
  try {
    const { semesterGroup = 'all' } = req.query;

    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateAllTeachersSchedulesPDF(semesterGroup);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No teacher schedule data found'
      });
    }

    // Set response headers
    const groupSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `Enhanced_All_Teachers_Schedules${groupSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Enhanced all teachers schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced all teachers schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export all rooms' schedules (enhanced version)
 * @route   GET /api/pdf/rooms/export/enhanced
 * @access  Public
 *
 * Same underlying logic as exportAllRoomSchedulesToPDF but exposed
 * under a separate route for backward compatibility.
 */
const exportEnhancedAllRoomsSchedules = async (req, res) => {
  try {

    const unifiedService = new UnifiedPDFService();
    const pdfBuffer = await unifiedService.generateAllRoomsSchedulePDF();

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No room schedule data found'
      });
    }

    // Set response headers
    const fileName = `Enhanced_All_Rooms_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);


  } catch (error) {
    console.error('❌ Enhanced all rooms schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced all rooms schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  exportRoutineToPDF,
  exportTeacherScheduleToPDF,
  exportAllTeachersSchedulesToPDF,
  exportRoomScheduleToPDF,
  exportAllRoomSchedulesToPDF,
  // Enhanced functionality
  exportTeacherWorkloadReport,
  exportRoomUtilizationReport,
  exportBuildingRoomsSchedulesToPDF,
  exportEnhancedAllTeachersSchedules,
  exportEnhancedAllRoomsSchedules
};
