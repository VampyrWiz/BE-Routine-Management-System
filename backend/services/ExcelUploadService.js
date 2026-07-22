/**
 * Excel Upload Service (Stub)
 *
 * Previously handled bulk data ingestion from Excel spreadsheets for departments,
 * programs, subjects, teachers, rooms, lab groups, and elective groups. This
 * functionality has been disabled; the stub preserves the API contract so that
 * callers receive a consistent error response instead of crashing.
 */

// Import all models
const Department = require('../models/Department');
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const RoutineSlot = require('../models/RoutineSlot');
const AcademicSession = require('../models/AcademicSession');
const LabGroup = require('../models/LabGroup');
const ElectiveGroup = require('../models/ElectiveGroup');

class ExcelUploadService {
  constructor() {
    this.uploadResults = {
      success: 0,
      failed: 0,
      errors: [],
      created: [],
      skipped: []
    };
  }

  /**
   * Main upload handler (stub)
   * Accepts a file path and data type but always returns an error indicating
   * the Excel upload feature has been disabled.
   * @param {string} filePath - Path to uploaded Excel file
   * @param {string} dataType - Type of data being uploaded (routine, subjects, teachers, etc.)
   * @param {Object} options - Additional upload options
   * @returns {Object} Upload results with error details
   */
  async uploadFromExcel(filePath, dataType, options = {}) {
    try {
      console.log(`📁 Excel Upload functionality has been disabled.`);
      
      // Reset results
      this.resetResults();
      
      // Add error message
      this.addError({
        message: 'Excel upload functionality has been disabled',
        details: 'This feature is no longer available'
      });
      
      return this.getResults();
    } catch (error) {
      console.error(`❌ Error in Excel upload handler:`, error);
      this.addError({
        message: 'Excel upload functionality has been disabled',
        details: error.message
      });
      return this.getResults();
    }
  }

  /**
   * Clears the upload results accumulator to prepare for a new upload cycle.
   */
  resetResults() {
    this.uploadResults = {
      success: 0,
      failed: 0,
      errors: [],
      created: [],
      skipped: []
    };
  }

  /**
   * Records an error message in the results object and increments the failure count.
   * @param {Object} error - Error object with message and details properties
   */
  addError(error) {
    this.uploadResults.errors.push(error);
    this.uploadResults.failed++;
  }

  /**
   * Returns the accumulated upload results (success/failure counts and error list).
   * @returns {Object} Upload results object
   */
  getResults() {
    return this.uploadResults;
  }

  /**
   * Stub: formerly parsed routine data from an Excel sheet and created RoutineSlot documents.
   * Now returns an error indicating the feature is disabled.
   */
  async processRoutineUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }

  /**
   * Stub: formerly imported subject definitions from an Excel sheet.
   * Now returns an error indicating the feature is disabled.
   */
  async processSubjectsUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }

  /**
   * Stub: formerly imported teacher records from an Excel sheet.
   * Now returns an error indicating the feature is disabled.
   */
  async processTeachersUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }

  /**
   * Stub: formerly imported room data from an Excel sheet.
   * Now returns an error indicating the feature is disabled.
   */
  async processRoomsUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }

  /**
   * Stub: formerly imported lab group definitions from an Excel sheet.
   * Now returns an error indicating the feature is disabled.
   */
  async processLabGroupsUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }

  /**
   * Stub: formerly imported elective group definitions from an Excel sheet.
   * Now returns an error indicating the feature is disabled.
   */
  async processElectiveGroupsUpload() {
    this.addError({
      message: 'Excel upload functionality has been disabled',
      details: 'This feature is no longer available'
    });
    return this.getResults();
  }
}

module.exports = ExcelUploadService;
