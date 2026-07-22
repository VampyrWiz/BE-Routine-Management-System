/**
 * Script to populate the BCT (Bachelor in Computer Engineering) syllabus
 * into the database. Creates/updates the Department of Computer Engineering,
 * the BCT program, all 8 semesters of subjects, ProgramSemester records,
 * and an AcademicCalendar entry.
 *
 * Usage: node backend/populate-bct-syllabus.js
 */

const mongoose = require('mongoose');
const Department = require('./models/Department');
const Program = require('./models/Program');
const Subject = require('./models/Subject');
const ProgramSemester = require('./models/ProgramSemester');
const AcademicCalendar = require('./models/AcademicCalendar');

const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/bctroutine';

const syllabusData = {
  department: {
    code: 'DOCE',
    name: 'Computer Engineering',
    fullName: 'Department of Computer Engineering'
  },
  program: {
    code: 'BCT',
    name: 'Bachelor in Computer Engineering',
    totalSemesters: 8,
    sections: ['AB', 'CD']
  },
  semesters: [
    {
      semester: 1, yearPart: 'Year I: Part I',
      subjects: [
        { code: 'ENSH 101', name: 'Engineering Mathematics I', credits: 3, L: 3, T: 2, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENCT 101', name: 'Computer Programming', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENME 101', name: 'Engineering Drawing', credits: 2, L: 2, T: 0, P: 4, theoryAssess: 20, theoryFinalDur: 3, theoryFinal: 30, pracAssess: 50, totalMarks: 100, remark: '' },
        { code: 'ENEX 101', name: 'Fundamental of Electrical and Electronics Engineering', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENSH 102', name: 'Engineering Physics', credits: 4, L: 4, T: 1, P: 2, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENME 106', name: 'Engineering Workshop', credits: 1, L: 1, T: 0, P: 3, theoryAssess: 20, theoryFinalDur: 0, theoryFinal: 0, pracAssess: 30, totalMarks: 50, remark: '' }
      ]
    },
    {
      semester: 2, yearPart: 'Year I: Part II',
      subjects: [
        { code: 'ENSH 151', name: 'Engineering Mathematics II', credits: 3, L: 3, T: 2, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENCT 151', name: 'Object Oriented Programming', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENEX 152', name: 'Digital Logic', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENEX 151', name: 'Electronic Device and Circuits', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENSH 153', name: 'Engineering Chemistry', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENEE 154', name: 'Electrical Circuits and Machines', credits: 4, L: 4, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' }
      ]
    },
    {
      semester: 3, yearPart: 'Year II: Part I',
      subjects: [
        { code: 'ENSH 201', name: 'Engineering Mathematics III', credits: 3, L: 3, T: 2, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENSH 204', name: 'Communication English', credits: 3, L: 3, T: 0, P: 1, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 201', name: 'Computer Graphics and Visualization', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENCT 202', name: 'Foundation of Data Science', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENCT 203', name: 'Theory of Computation', credits: 3, L: 3, T: 1, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENEX 201', name: 'Microprocessors', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' }
      ]
    },
    {
      semester: 4, yearPart: 'Year II: Part II',
      subjects: [
        { code: 'ENSH 252', name: 'Numerical Methods', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENEX 252', name: 'Instrumentation', credits: 4, L: 4, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENEX 254', name: 'Electromagnetics', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 252', name: 'Data Structure and Algorithm', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENCT 253', name: 'Data Communication', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 254', name: 'Operating System', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' }
      ]
    },
    {
      semester: 5, yearPart: 'Year III: Part I',
      subjects: [
        { code: 'ENSH 304', name: 'Probability and Statistics', credits: 3, L: 3, T: 1, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENCT 301', name: 'Database Management System', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: 'Micro-Syllabus' },
        { code: 'ENCT 302', name: 'Web Application Programming', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: 'Micro-Syllabus' },
        { code: 'ENCT 303', name: 'Computer Organization and Architecture', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: 'Micro-Syllabus' },
        { code: 'ENCT 304', name: 'Computer Networks', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: 'Micro-Syllabus' },
        { code: 'ENCT 325-344', name: 'Elective I', credits: 3, L: 3, T: 2, P: 1, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' }
      ]
    },
    {
      semester: 6, yearPart: 'Year III: Part II',
      subjects: [
        { code: 'ENCE 356', name: 'Engineering Economics', credits: 3, L: 3, T: 1, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENCT 351', name: 'Artificial Intelligence', credits: 3, L: 3, T: 1, P: 3, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 50, totalMarks: 150, remark: '' },
        { code: 'ENCT 352', name: 'Software Engineering', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 353', name: 'Simulation and Modeling', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 354', name: 'Minor Project', credits: 1, L: 0, T: 0, P: 0, theoryAssess: 0, theoryFinalDur: 0, theoryFinal: 0, pracAssess: 50, totalMarks: 50, remark: '' },
        { code: 'ENCT 385-399', name: 'Elective II', credits: 3, L: 3, T: 2, P: 1, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' }
      ]
    },
    {
      semester: 7, yearPart: 'Year IV: Part I',
      subjects: [
        { code: 'ENEX 416', name: 'Digital Signal Analysis and Processing', credits: 4, L: 4, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 411', name: 'Distributed and Cloud Computing', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 412', name: 'ICT Project Management', credits: 3, L: 3, T: 1, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENEX 417', name: 'Energy, Environment and Social Engineering', credits: 3, L: 3, T: 0, P: 0, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 0, totalMarks: 100, remark: '' },
        { code: 'ENCT 435-444', name: 'Elective III', credits: 3, L: 3, T: 2, P: 1, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 413', name: 'Project I', credits: 2, L: 0, T: 0, P: 0, theoryAssess: 0, theoryFinalDur: 0, theoryFinal: 0, pracAssess: 50, totalMarks: 50, remark: '' }
      ]
    },
    {
      semester: 8, yearPart: 'Year IV: Part II',
      subjects: [
        { code: 'ENCT 463', name: 'Network and Cyber Security', credits: 3, L: 3, T: 1, P: 1.5, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 465-474', name: 'Elective IV', credits: 3, L: 3, T: 2, P: 1, theoryAssess: 40, theoryFinalDur: 3, theoryFinal: 60, pracAssess: 25, totalMarks: 125, remark: '' },
        { code: 'ENCT 462', name: 'Internship', credits: 4, L: 0, T: 0, P: 0, theoryAssess: 0, theoryFinalDur: 0, theoryFinal: 0, pracAssess: 100, totalMarks: 150, remark: '' },
        { code: 'ENCT 461', name: 'Project II', credits: 4, L: 0, T: 0, P: 0, theoryAssess: 0, theoryFinalDur: 0, theoryFinal: 0, pracAssess: 100, totalMarks: 150, remark: '' }
      ]
    }
  ]
};

/**
 * Removes all whitespace from a subject code string for consistent lookups.
 */
function normalizeCode(code) {
  return code.replace(/\s+/g, '');
}

/**
 * Main routine: connects to MongoDB, ensures the DOCE department and BCT
 * program exist, creates a default AcademicCalendar if none exists, then
 * iterates through all 8 semesters creating/updating Subject documents and
 * the corresponding ProgramSemester document with full subject metadata.
 * Ends with a verification summary.
 */
async function populateBCTSyllabus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    // 1. Find or create department
    let department = await Department.findOne({ code: syllabusData.department.code });
    if (!department) {
      department = await Department.create(syllabusData.department);
      console.log(`Created department: ${department.code} - ${department.name}`);
    } else {
      console.log(`Found existing department: ${department.code} - ${department.name}`);
    }

    // 2. Find or create program
    let program = await Program.findOne({ code: syllabusData.program.code });
    if (!program) {
      program = await Program.create({
        ...syllabusData.program,
        departmentId: department._id
      });
      console.log(`Created program: ${program.code} - ${program.name}`);
    } else {
      console.log(`Found existing program: ${program.code} - ${program.name}`);
      if (!program.departmentId) {
        program.departmentId = department._id;
        await program.save();
        console.log('  Updated program with departmentId');
      }
    }

    // 2.5 Find or create AcademicCalendar
    let academicCalendar = await AcademicCalendar.findOne({});
    if (!academicCalendar) {
      academicCalendar = await AcademicCalendar.create({
        title: 'Academic Year 2081-2082',
        nepaliYear: '2081/2082',
        englishYear: '2024/2025',
        startDate: new Date('2024-07-16'),
        endDate: new Date('2025-07-15'),
        isCurrentYear: true,
        status: 'Current'
      });
      console.log(`Created academic calendar: ${academicCalendar.title}`);
    } else {
      console.log(`Found academic calendar: ${academicCalendar.title}`);
    }
    const academicYearId = academicCalendar._id;

    console.log('\n--- Processing Syllabus ---\n');

    for (const sem of syllabusData.semesters) {
      console.log(`\n========== Semester ${sem.semester} (${sem.yearPart}) ==========`);

      // 3. Create subjects for this semester
      const createdSubjects = [];
      for (const sub of sem.subjects) {
        const normCode = normalizeCode(sub.code);
        let subject = await Subject.findOne({ code: normCode });

        const subjectData = {
          programId: [program._id],
          departmentId: department._id,
          code: normCode,
          name: sub.name,
          credits: { theory: sub.credits, practical: 0, tutorial: 0 },
          weeklyHours: { theory: sub.L, practical: sub.P, tutorial: sub.T },
          requiresLab: sub.P > 0,
          defaultLabGroups: sub.P > 0 ? 2 : 1,
          semester: sem.semester,
          isActive: true
        };

        if (subject) {
          await Subject.updateOne({ _id: subject._id }, subjectData);
          console.log(`  Updated subject: ${normCode} - ${sub.name}`);
        } else {
          subject = await Subject.create(subjectData);
          console.log(`  Created subject: ${normCode} - ${sub.name}`);
        }

        createdSubjects.push({
          subjectId: subject._id,
          subject: subject
        });
      }

      // 4. Create/update ProgramSemester document
      const subjectsOffered = createdSubjects.map(({ subject, subjectId }, idx) => {
        const sub = sem.subjects[idx];
        return {
          subjectId: subjectId,
          subjectCode: normalizeCode(sub.code),
          subjectName: sub.name,
          credits: { theory: sub.credits, practical: 0, tutorial: 0 },
          weeklyHours: { theory: sub.L, practical: sub.P, tutorial: sub.T },
          type: sub.code.includes('Elective') ? 'Department Elective' : 'Compulsory',
          isElective: sub.code.includes('Elective'),
          requiresLab: sub.P > 0,
          labGroupCount: sub.P > 0 ? 2 : 1,
          theoryAssessmentMarks: sub.theoryAssess,
          theoryFinalDuration: sub.theoryFinalDur,
          theoryFinalMarks: sub.theoryFinal,
          practicalAssessmentMarks: sub.pracAssess,
          practicalFinalDuration: 0,
          practicalFinalMarks: 0,
          totalMarks: sub.totalMarks,
          remark: sub.remark,
          courseType: sub.code.includes('Elective') ? 'Elective Group A' : 'Core',
          defaultHoursTheory: sub.L,
          defaultHoursPractical: sub.P,
          subjectCode_display: normalizeCode(sub.code),
          subjectName_display: sub.name
        };
      });

      let programSemester = await ProgramSemester.findOne({
        programCode: program.code,
        semester: sem.semester
      });

      if (programSemester) {
        programSemester.subjects = subjectsOffered;
        programSemester.status = 'Active';
        programSemester.isActive = true;
        await programSemester.save();
        console.log(`  Updated ProgramSemester for semester ${sem.semester}`);
      } else {
        await ProgramSemester.create({
          programId: program._id,
          semester: sem.semester,
          academicYearId: academicYearId,
          programCode: program.code,
          subjects: subjectsOffered,
          status: 'Active',
          isActive: true,
          academicYear: '2024-2025'
        });
        console.log(`  Created ProgramSemester for semester ${sem.semester}`);
      }
    }

    console.log('\n========== VERIFICATION ==========\n');
    const totalSubjects = await Subject.countDocuments({ programId: program._id });
    console.log(`Total subjects created: ${totalSubjects}`);

    for (let s = 1; s <= 8; s++) {
      const count = await Subject.countDocuments({ programId: program._id, semester: s });
      const ps = await ProgramSemester.findOne({ programCode: program.code, semester: s });
      const subCount = ps ? ps.subjects.length : 0;
      console.log(`Semester ${s}: ${count} subjects in master, ${subCount} in ProgramSemester`);
    }

    console.log('\n✅ BCT Syllabus populated successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

populateBCTSyllabus();
