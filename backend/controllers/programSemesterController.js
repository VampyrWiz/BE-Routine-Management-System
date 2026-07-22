const ProgramSemester = require('../models/ProgramSemester');
const Subject = require('../models/Subject');
const Program = require('../models/Program');
const { validationResult } = require('express-validator');

exports.getSubjectsForProgramSemester = async (req, res) => {
  try {
    const { programCode, semester } = req.params;

    const programSemesterDoc = await ProgramSemester.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      status: 'Active'
    });

    if (!programSemesterDoc) {
      return res.json({
        success: true,
        data: [],
        message: `No curriculum found for ${programCode} Semester ${semester}`
      });
    }

    const subjectsWithInfo = programSemesterDoc.subjects.map(subject => ({
      _id: subject.subjectId,
      subjectId: subject.subjectId,
      code: subject.subjectCode || subject.subjectCode_display,
      name: subject.subjectName || subject.subjectName_display,
      credits: subject.credits,
      weeklyHours: subject.weeklyHours,
      type: subject.type || 'Compulsory',
      isElective: subject.isElective,
      courseType: subject.courseType,
      defaultHoursTheory: subject.defaultHoursTheory || subject.weeklyHours?.theory || 3,
      defaultHoursPractical: subject.defaultHoursPractical || subject.weeklyHours?.practical || 0,
      requiresLab: subject.requiresLab,
      theoryAssessmentMarks: subject.theoryAssessmentMarks,
      theoryFinalDuration: subject.theoryFinalDuration,
      theoryFinalMarks: subject.theoryFinalMarks,
      practicalAssessmentMarks: subject.practicalAssessmentMarks,
      practicalFinalDuration: subject.practicalFinalDuration,
      practicalFinalMarks: subject.practicalFinalMarks,
      totalMarks: subject.totalMarks,
      remark: subject.remark
    }));

    res.json({
      success: true,
      data: subjectsWithInfo,
      programCode: programSemesterDoc.programCode,
      semester: programSemesterDoc.semester,
      academicYear: programSemesterDoc.academicYear
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.getProgramCurriculum = async (req, res) => {
  try {
    const { programCode } = req.params;

    const curriculum = await ProgramSemester.find({
      programCode: programCode.toUpperCase(),
      status: 'Active'
    }).sort({ semester: 1 }).lean();

    res.json({
      success: true,
      data: curriculum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.createProgramSemester = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { programCode, semester, subjects: subjectsData, academicYear } = req.body;

    const program = await Program.findOne({ code: programCode.toUpperCase() });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    const subjectIds = subjectsData.map(s => s.subjectId);
    const foundSubjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
    const subjectMap = new Map(foundSubjects.map(s => [s._id.toString(), s]));

    const populatedSubjects = [];
    for (const subjectData of subjectsData) {
      const subject = subjectMap.get(subjectData.subjectId.toString());
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: `Subject not found: ${subjectData.subjectId}`
        });
      }

      const L = subjectData.defaultHoursTheory || subject.weeklyHours?.theory || subjectData.weeklyHours?.theory || 3;
      const P = subjectData.defaultHoursPractical || subject.weeklyHours?.practical || subjectData.weeklyHours?.practical || 0;
      const T = subject.weeklyHours?.tutorial || subjectData.weeklyHours?.tutorial || 0;

      populatedSubjects.push({
        subjectId: subject._id,
        subjectCode: subjectData.subjectCode || subject.code,
        subjectName: subjectData.subjectName || subject.name,
        credits: {
          theory: subjectData.credits?.theory || subject.credits?.theory || L,
          practical: subjectData.credits?.practical || subject.credits?.practical || 0,
          tutorial: subjectData.credits?.tutorial || subject.credits?.tutorial || 0
        },
        weeklyHours: {
          theory: L,
          practical: P,
          tutorial: T
        },
        type: subjectData.type || 'Compulsory',
        isElective: subjectData.isElective || false,
        requiresLab: P > 0,
        labGroupCount: subjectData.labGroupCount || (P > 0 ? 2 : 1),
        theoryAssessmentMarks: subjectData.theoryAssessmentMarks ?? 40,
        theoryFinalDuration: subjectData.theoryFinalDuration ?? 3,
        theoryFinalMarks: subjectData.theoryFinalMarks ?? 60,
        practicalAssessmentMarks: subjectData.practicalAssessmentMarks ?? 0,
        practicalFinalDuration: subjectData.practicalFinalDuration ?? 0,
        practicalFinalMarks: subjectData.practicalFinalMarks ?? 0,
        totalMarks: subjectData.totalMarks ?? 100,
        remark: subjectData.remark || '',
        courseType: subjectData.courseType || (subjectData.isElective ? 'Elective Group A' : 'Core'),
        defaultHoursTheory: L,
        defaultHoursPractical: P,
        subjectCode_display: subjectData.subjectCode || subject.code,
        subjectName_display: subjectData.subjectName || subject.name
      });
    }

    let programSemester = await ProgramSemester.findOne({
      programCode: programCode.toUpperCase(),
      semester,
      status: 'Active'
    });

    if (programSemester) {
      programSemester.subjects = populatedSubjects;
      programSemester.academicYear = academicYear || programSemester.academicYear;
      await programSemester.save();
    } else {
      programSemester = await ProgramSemester.create({
        programId: program._id,
        programCode: programCode.toUpperCase(),
        semester,
        subjects: populatedSubjects,
        academicYear: academicYear || '2024-2025',
        status: 'Active',
        isActive: true
      });
    }

    res.status(201).json({
      success: true,
      data: programSemester
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.addSubjectToProgramSemester = async (req, res) => {
  try {
    const { programCode, semester } = req.params;
    const { subjectId, ...rest } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    let programSemester = await ProgramSemester.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      status: 'Active'
    });

    if (!programSemester) {
      return res.status(404).json({
        success: false,
        message: 'Program semester not found'
      });
    }

    const existingSubject = programSemester.subjects.find(
      s => s.subjectId.toString() === subjectId
    );

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: 'Subject already exists in this program semester'
      });
    }

    const L = rest.defaultHoursTheory || subject.weeklyHours?.theory || 3;
    const P = rest.defaultHoursPractical || subject.weeklyHours?.practical || 0;
    const T = subject.weeklyHours?.tutorial || 0;

    programSemester.subjects.push({
      subjectId: subject._id,
      subjectCode: rest.subjectCode || subject.code,
      subjectName: rest.subjectName || subject.name,
      credits: {
        theory: rest.credits?.theory || subject.credits?.theory || L,
        practical: rest.credits?.practical || subject.credits?.practical || 0,
        tutorial: rest.credits?.tutorial || subject.credits?.tutorial || 0
      },
      weeklyHours: { theory: L, practical: P, tutorial: T },
      type: rest.type || 'Compulsory',
      isElective: rest.isElective || false,
      requiresLab: P > 0,
      labGroupCount: rest.labGroupCount || (P > 0 ? 2 : 1),
      theoryAssessmentMarks: rest.theoryAssessmentMarks ?? 40,
      theoryFinalDuration: rest.theoryFinalDuration ?? 3,
      theoryFinalMarks: rest.theoryFinalMarks ?? 60,
      practicalAssessmentMarks: rest.practicalAssessmentMarks ?? 0,
      practicalFinalDuration: rest.practicalFinalDuration ?? 0,
      practicalFinalMarks: rest.practicalFinalMarks ?? 0,
      totalMarks: rest.totalMarks ?? 100,
      remark: rest.remark || '',
      courseType: rest.courseType || (rest.isElective ? 'Elective Group A' : 'Core'),
      defaultHoursTheory: L,
      defaultHoursPractical: P,
      subjectCode_display: rest.subjectCode || subject.code,
      subjectName_display: rest.subjectName || subject.name
    });

    await programSemester.save();

    res.json({
      success: true,
      data: programSemester
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.removeSubjectFromProgramSemester = async (req, res) => {
  try {
    const { programCode, semester, subjectId } = req.params;

    const programSemester = await ProgramSemester.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      status: 'Active'
    });

    if (!programSemester) {
      return res.status(404).json({
        success: false,
        message: 'Program semester not found'
      });
    }

    programSemester.subjects = programSemester.subjects.filter(
      s => s.subjectId.toString() !== subjectId
    );

    await programSemester.save();

    res.json({
      success: true,
      data: programSemester
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
