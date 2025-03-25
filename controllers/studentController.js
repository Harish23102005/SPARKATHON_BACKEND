const { Sequelize, Op } = require("sequelize");
const { Student, Mark, MarksCoMapping, CourseOutcome } = require("../models");
const ExcelJS = require("exceljs");

// Function to map percentage to CO level (1 to 3)
const mapPercentageToLevel = (percentage) => {
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 2;
  return 1;
};

// Function to calculate student average based on all marks
const calculateStudentAverage = (marks) => {
  if (!marks || marks.length === 0) return null;

  const totalPercentage = marks.reduce((sum, mark) => {
    const internalPercentage =
      (mark.internal / (mark.totalInternal || 1)) * 100;
    const examPercentage = (mark.exam / (mark.totalExam || 1)) * 100;
    return sum + (internalPercentage + examPercentage) / 2;
  }, 0);

  const average = totalPercentage / marks.length;
  return parseFloat(average.toFixed(2));
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Mark, include: [MarksCoMapping], required: false },
        { model: CourseOutcome, required: false },
      ],
      where: {
        student_id: {
          [Op.ne]: null,
          [Op.ne]: "",
        },
      },
    });

    const validStudents = students.filter(
      (student) =>
        student.student_id &&
        typeof student.student_id === "string" &&
        student.student_id.trim() !== ""
    );
    res.json(validStudents);
  } catch (error) {
    console.error("Error fetching students:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Failed to fetch students: " + error.message });
  }
};

const addStudent = async (req, res) => {
  const transaction = await Student.sequelize.transaction();
  try {
    const { studentId, name, department, marks, courseOutcomes } = req.body;

    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid student ID" });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid student name" });
    }

    if (
      !department ||
      typeof department !== "string" ||
      department.trim() === ""
    ) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid department" });
    }

    const studentData = {
      student_id: studentId,
      name,
      department,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingStudent = await Student.findOne({
      where: { student_id: studentId },
      transaction,
    });
    if (existingStudent) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Student with this ID already exists" });
    }

    const newStudent = await Student.create(studentData, { transaction });

    if (marks && Array.isArray(marks) && marks.length > 0) {
      await Promise.all(
        marks.map(async (mark) => {
          if (
            !mark.year ||
            mark.internal === undefined ||
            mark.exam === undefined ||
            mark.totalInternal === undefined ||
            mark.totalExam === undefined
          ) {
            throw new Error("Invalid mark data: missing required fields");
          }
          const newMark = await Mark.create(
            {
              student_id: studentId,
              year: mark.year,
              internal: parseFloat(mark.internal) || 0,
              exam: parseFloat(mark.exam) || 0,
              totalInternal: parseFloat(mark.totalInternal) || 0,
              totalExam: parseFloat(mark.totalExam) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );

          if (
            mark.coMapping &&
            Array.isArray(mark.coMapping) &&
            mark.coMapping.length > 0
          ) {
            await Promise.all(
              mark.coMapping.map(async (coMap) => {
                if (
                  !coMap.coId ||
                  coMap.internal === undefined ||
                  coMap.exam === undefined ||
                  coMap.totalInternal === undefined ||
                  coMap.totalExam === undefined
                ) {
                  throw new Error(
                    "Invalid CO mapping data: missing required fields"
                  );
                }
                await MarksCoMapping.create(
                  {
                    mark_id: newMark.id,
                    coId: coMap.coId,
                    internal: parseFloat(coMap.internal) || 0,
                    exam: parseFloat(coMap.exam) || 0,
                    totalInternal: parseFloat(coMap.totalInternal) || 0,
                    totalExam: parseFloat(coMap.totalExam) || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  { transaction }
                );
              })
            );
          }
        })
      );
    }

    if (
      courseOutcomes &&
      Array.isArray(courseOutcomes) &&
      courseOutcomes.length > 0
    ) {
      await Promise.all(
        courseOutcomes.map(async (co) => {
          if (!co.coId || co.target === undefined) {
            throw new Error(
              "Invalid course outcome data: missing required fields"
            );
          }
          await CourseOutcome.create(
            {
              student_id: studentId,
              coId: co.coId,
              target: parseFloat(co.target) || 70,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );
        })
      );
    }

    // Calculate and update average
    const createdMarks = await Mark.findAll({
      where: { student_id: studentId },
      transaction,
    });
    const average = calculateStudentAverage(createdMarks);
    await newStudent.update({ average }, { transaction });

    const createdStudent = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
      ],
      transaction,
    });

    await transaction.commit();
    res
      .status(201)
      .json({ message: "Student added successfully", student: createdStudent });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating student:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Failed to create student: " + error.message });
  }
};

const updateMarks = async (req, res) => {
  const transaction = await Student.sequelize.transaction();
  try {
    const { studentId } = req.params;
    const { marks, average } = req.body;

    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [{ model: Mark, include: [MarksCoMapping] }],
      transaction,
    });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    // Append new marks instead of deleting existing ones
    if (marks && Array.isArray(marks) && marks.length > 0) {
      await Promise.all(
        marks.map(async (mark) => {
          if (
            !mark.year ||
            mark.internal === undefined ||
            mark.exam === undefined ||
            mark.totalInternal === undefined ||
            mark.totalExam === undefined
          ) {
            throw new Error("Invalid mark data: missing required fields");
          }
          const newMark = await Mark.create(
            {
              student_id: studentId,
              year: mark.year,
              internal: parseFloat(mark.internal) || 0,
              exam: parseFloat(mark.exam) || 0,
              totalInternal: parseFloat(mark.totalInternal) || 0,
              totalExam: parseFloat(mark.totalExam) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );

          if (
            mark.coMapping &&
            Array.isArray(mark.coMapping) &&
            mark.coMapping.length > 0
          ) {
            await Promise.all(
              mark.coMapping.map(async (coMap) => {
                if (
                  !coMap.coId ||
                  coMap.internal === undefined ||
                  coMap.exam === undefined ||
                  coMap.totalInternal === undefined ||
                  coMap.totalExam === undefined
                ) {
                  throw new Error(
                    "Invalid CO mapping data: missing required fields"
                  );
                }
                await MarksCoMapping.create(
                  {
                    mark_id: newMark.id,
                    coId: coMap.coId,
                    internal: parseFloat(coMap.internal) || 0,
                    exam: parseFloat(coMap.exam) || 0,
                    totalInternal: parseFloat(coMap.totalInternal) || 0,
                    totalExam: parseFloat(coMap.totalExam) || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  { transaction }
                );
              })
            );
          }
        })
      );
    }

    // Recalculate average based on all marks
    const allMarks = await Mark.findAll({
      where: { student_id: studentId },
      transaction,
    });
    const newAverage = calculateStudentAverage(allMarks);
    await student.update({ average: newAverage }, { transaction });

    const updatedStudent = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
      ],
      transaction,
    });

    await transaction.commit();
    res.json({
      message: "Marks updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating marks:", error.message, error.stack);
    res.status(500).json({ error: "Failed to update marks: " + error.message });
  }
};

// New function to update course outcomes
const updateCourseOutcomes = async (req, res) => {
  const transaction = await Student.sequelize.transaction();
  try {
    const { studentId } = req.params;
    const { courseOutcomes } = req.body;

    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [{ model: CourseOutcome }],
      transaction,
    });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    // Delete existing course outcomes
    await CourseOutcome.destroy({
      where: { student_id: studentId },
      transaction,
    });

    // Add new course outcomes
    if (
      courseOutcomes &&
      Array.isArray(courseOutcomes) &&
      courseOutcomes.length > 0
    ) {
      await Promise.all(
        courseOutcomes.map(async (co) => {
          if (!co.coId || co.target === undefined) {
            throw new Error(
              "Invalid course outcome data: missing required fields"
            );
          }
          await CourseOutcome.create(
            {
              student_id: studentId,
              coId: co.coId,
              target: parseFloat(co.target) || 70,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );
        })
      );
    }

    const updatedStudent = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
      ],
      transaction,
    });

    await transaction.commit();
    res.json({
      message: "Course outcomes updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Error updating course outcomes:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ error: "Failed to update course outcomes: " + error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Failed to delete student: " + error.message });
  }
};

const calculateCoPoAttainment = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
      ],
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const coSummary = [];
    const courseOutcomes = student.CourseOutcomes || [];
    const marks = student.Marks || [];

    for (const co of courseOutcomes) {
      let totalAttainment = 0;
      let count = 0;

      for (const mark of marks) {
        const coMapping = mark.MarksCoMappings.find((m) => m.coId === co.coId);
        if (coMapping) {
          const internalAttainment =
            coMapping.totalInternal !== 0
              ? (coMapping.internal / coMapping.totalInternal) * 100
              : 0;
          const examAttainment =
            coMapping.totalExam !== 0
              ? (coMapping.exam / coMapping.totalExam) * 100
              : 0;
          const avgAttainment = (internalAttainment + examAttainment) / 2;
          totalAttainment += avgAttainment;
          count++;
        }
      }

      const avgAttainment = count > 0 ? totalAttainment / count : 0;
      coSummary.push({
        coId: co.coId,
        avgAttainment: parseFloat(avgAttainment.toFixed(2)),
        target: co.target,
      });
    }

    res.json({ coSummary });
  } catch (error) {
    console.error("Error calculating CO:", error.message, error.stack);
    res.status(500).json({ error: "Failed to calculate CO: " + error.message });
  }
};

const uploadSemesterResults = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.internal ||
      !req.files.assignment ||
      !req.files.classTest ||
      !req.files.semester
    ) {
      return res.status(400).json({
        error:
          "All files (internal, assignment, classTest, semester) are required",
      });
    }

    const readExcelFile = async (buffer) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      return workbook;
    };

    const internalWb = await readExcelFile(req.files.internal[0].buffer);
    const assignmentWb = await readExcelFile(req.files.assignment[0].buffer);
    const classTestWb = await readExcelFile(req.files.classTest[0].buffer);
    const semesterWb = await readExcelFile(req.files.semester[0].buffer);

    const sheetToJson = (worksheet) => {
      const json = [];
      let headers = [];
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) {
          headers = row.values.slice(1);
        } else {
          const rowData = {};
          row.values.slice(1).forEach((cell, index) => {
            rowData[headers[index]] = cell;
          });
          json.push(rowData);
        }
      });
      return json;
    };

    const internalSheets = internalWb.worksheets
      .slice(0, 3)
      .map((worksheet) => sheetToJson(worksheet));
    const assignmentSheets = assignmentWb.worksheets
      .slice(0, 3)
      .map((worksheet) => sheetToJson(worksheet));
    const classTestSheets = classTestWb.worksheets
      .slice(0, 2)
      .map((worksheet) => sheetToJson(worksheet));
    const semesterSheets = semesterWb.worksheets
      .slice(0, 1)
      .map((worksheet) => sheetToJson(worksheet));

    if (
      internalSheets.length === 0 ||
      internalSheets.every((sheet) => sheet.length === 0)
    ) {
      return res.status(400).json({ error: "Internal file is empty" });
    }
    if (
      assignmentSheets.length === 0 ||
      assignmentSheets.every((sheet) => sheet.length === 0)
    ) {
      return res.status(400).json({ error: "Assignment file is empty" });
    }
    if (
      classTestSheets.length === 0 ||
      classTestSheets.every((sheet) => sheet.length === 0)
    ) {
      return res.status(400).json({ error: "Class Test file is empty" });
    }
    if (semesterSheets.length === 0 || semesterSheets[0].length === 0) {
      return res.status(400).json({ error: "Semester file is empty" });
    }

    const coAttainment = {
      internal1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      internal2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      internal3: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      internalAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      assignment1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      assignment2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      assignment3: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      assignmentAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      classTest1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      classTest2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      classTestAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      seminar: { CO1: 3.0, CO2: 3.0, CO3: 3.0, CO4: 3.0, CO5: 3.0, CO6: 3.0 },
      workProject: {
        CO1: 3.0,
        CO2: 3.0,
        CO3: 3.0,
        CO4: 3.0,
        CO5: 3.0,
        CO6: 3.0,
      },
      cia: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      see: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      direct: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      indirect: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      overall: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
    };

    const targetAttained = {
      CO1: false,
      CO2: false,
      CO3: false,
      CO4: false,
      CO5: false,
      CO6: false,
    };

    const parameters = {
      x: 0.8,
      y: 0.2,
      u: 0.9,
      v: 0.1,
      targetAttainmentLevel: 2.6,
      levelThresholds: { level3: 70, level2: 60 },
      studentScoreTarget: 60,
    };

    const internalMaxMarks = {
      internal1: { CO1: 88, CO2: 62, CO3: 0, CO4: 0, CO5: 0, CO6: 30 },
      internal2: { CO1: 0, CO2: 0, CO3: 103, CO4: 77, CO5: 0, CO6: 0 },
      internal3: { CO1: 30, CO2: 45, CO3: 30, CO4: 30, CO5: 28, CO6: 17 },
    };

    for (let i = 1; i <= 3; i++) {
      if (i > internalSheets.length || internalSheets[i - 1].length === 0) {
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          coAttainment[`internal${i}`][coId] = "-";
        }
        continue;
      }

      const internalData = internalSheets[i - 1];
      const studentsAbove60 = {
        CO1: 0,
        CO2: 0,
        CO3: 0,
        CO4: 0,
        CO5: 0,
        CO6: 0,
      };
      let studentCount = 0;

      for (let j = 0; j < internalData.length; j++) {
        const percentages = {};
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          let coTotal = 0;
          for (let col in internalData[j]) {
            if (col.startsWith(coId)) {
              if (i === 2 && coId === "CO3" && col === "CO3.11") continue;
              if (i === 2 && coId === "CO4" && col === "CO4.9") continue;
              if (i === 3 && coId === "CO2" && col === "CO2.4") continue;
              if (i === 3 && coId === "CO6" && col === "CO6.1") continue;
              const marks = Number(internalData[j][col]) || 0;
              coTotal += marks;
            }
          }
          const maxMarks = internalMaxMarks[`internal${i}`][coId];
          percentages[coId] = maxMarks > 0 ? (coTotal / maxMarks) * 100 : 0;
          if (percentages[coId] >= 60) {
            studentsAbove60[coId]++;
          }
        }
        studentCount++;
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const percentageAbove60 =
          studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
        const level = mapPercentageToLevel(percentageAbove60);
        coAttainment[`internal${i}`][coId] =
          internalMaxMarks[`internal${i}`][coId] > 0 ? level : "-";
      }
    }

    const internalAverage = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 };
    const internalCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 };

    for (let k = 1; k <= 6; k++) {
      const coId = `CO${k}`;
      let totalLevel = 0;
      let count = 0;

      for (let i = 1; i <= 3; i++) {
        const level = coAttainment[`internal${i}`][coId];
        if (level !== "-" && internalMaxMarks[`internal${i}`][coId] > 0) {
          totalLevel += level;
          count++;
        }
      }

      internalAverage[coId] = count > 0 ? totalLevel / count : 0;
      internalCounts[coId] = count;
      coAttainment.internalAvg[coId] = count > 0 ? internalAverage[coId] : 0;
    }

    for (let i = 1; i <= 3; i++) {
      if (i > assignmentSheets.length || assignmentSheets[i - 1].length === 0) {
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          coAttainment[`assignment${i}`][coId] = "-";
        }
        continue;
      }

      const assignmentData = assignmentSheets[i - 1];
      let assignmentMaxMarks = 10;
      const studentsAbove60 = {
        CO1: 0,
        CO2: 0,
        CO3: 0,
        CO4: 0,
        CO5: 0,
        CO6: 0,
      };
      let studentCount = 0;

      for (let j = 0; j < assignmentData.length; j++) {
        const percentages = {};
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          const marks = Number(assignmentData[j][coId]) || 0;
          if (marks > assignmentMaxMarks) {
            assignmentMaxMarks = marks;
          }
          percentages[coId] = (marks / assignmentMaxMarks) * 100;
          if (percentages[coId] >= 60) {
            studentsAbove60[coId]++;
          }
        }
        studentCount++;
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const percentageAbove60 =
          studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
        const level = mapPercentageToLevel(percentageAbove60);
        coAttainment[`assignment${i}`][coId] = level;
      }
    }

    for (let k = 1; k <= 6; k++) {
      const coId = `CO${k}`;
      let totalLevel = 0;
      let count = 0;

      for (let i = 1; i <= 3; i++) {
        const level = coAttainment[`assignment${i}`][coId];
        if (level !== "-") {
          totalLevel += level;
          count++;
        }
      }

      coAttainment.assignmentAvg[coId] = count > 0 ? totalLevel / count : 0;
    }

    for (let i = 1; i <= 2; i++) {
      if (i > classTestSheets.length || classTestSheets[i - 1].length === 0) {
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          coAttainment[`classTest${i}`][coId] = "-";
        }
        continue;
      }

      const classTestData = classTestSheets[i - 1];
      let classTestMaxMarks = 10;
      const studentsAbove60 = {
        CO1: 0,
        CO2: 0,
        CO3: 0,
        CO4: 0,
        CO5: 0,
        CO6: 0,
      };
      let studentCount = 0;

      for (let j = 0; j < classTestData.length; j++) {
        const percentages = {};
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          const marks = Number(classTestData[j][coId]) || 0;
          if (marks > classTestMaxMarks) {
            classTestMaxMarks = marks;
          }
          percentages[coId] = (marks / classTestMaxMarks) * 100;
          if (percentages[coId] >= 60) {
            studentsAbove60[coId]++;
          }
        }
        studentCount++;
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const percentageAbove60 =
          studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
        const level = mapPercentageToLevel(percentageAbove60);
        coAttainment[`classTest${i}`][coId] = level;
      }
    }

    for (let k = 1; k <= 6; k++) {
      const coId = `CO${k}`;
      let totalLevel = 0;
      let count = 0;

      for (let i = 1; i <= 2; i++) {
        const level = coAttainment[`classTest${i}`][coId];
        if (level !== "-") {
          totalLevel += level;
          count++;
        }
      }

      coAttainment.classTestAvg[coId] = count > 0 ? totalLevel / count : 0;
    }

    for (let k = 1; k <= 6; k++) {
      const coId = `CO${k}`;
      const internalAvg = coAttainment.internalAvg[coId];
      const assignmentAvg = coAttainment.assignmentAvg[coId];
      const classTestAvg = coAttainment.classTestAvg[coId];
      const ciaValue =
        (internalAvg > 0 ? internalAvg : 0) * 0.5 +
        (assignmentAvg > 0 ? assignmentAvg : 0) * 0.3 +
        (classTestAvg > 0 ? classTestAvg : 0) * 0.2;
      coAttainment.cia[coId] = Math.min(Math.max(ciaValue, 1), 3);
    }

    const semesterScores = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 };
    const coMapping = {
      CO1: [
        "CO1",
        "CO1.1",
        "CO1.2",
        "CO1.3",
        "CO1.4",
        "CO1.5",
        "CO1.6",
        "CO1.7",
        "CO1.8",
        "CO1.9",
        "CO1.10",
      ],
      CO2: [
        "CO2",
        "CO2.1",
        "CO2.2",
        "CO2.3",
        "CO2.4",
        "CO2.5",
        "CO2.6",
        "CO2.7",
        "CO2.8",
        "CO2.9",
      ],
      CO3: ["CO3"],
      CO4: ["CO4"],
      CO5: ["CO5"],
      CO6: ["CO6"],
    };
    let studentCount = 0;

    const semesterData = semesterSheets[0];
    const transaction = await Student.sequelize.transaction();
    try {
      for (let i = 0; i < semesterData.length; i++) {
        const studentId = semesterData[i]["Student ID"]?.toString();
        const name = semesterData[i]["Name"] || "Unknown";
        const department = semesterData[i]["Department"] || "Unknown";
        const total = Number(semesterData[i]["Mark"]) || 0;
        const percentage = (total / 100) * 100;
        const level = mapPercentageToLevel(percentage);

        if (!studentId || studentId.trim() === "") {
          continue;
        }

        let student = await Student.findOne({
          where: { student_id: studentId },
          transaction,
        });

        if (!student) {
          student = await Student.create(
            {
              student_id: studentId,
              name,
              department,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );
        }

        const newMark = await Mark.create(
          {
            student_id: studentId,
            year: new Date().getFullYear().toString(),
            internal: 0,
            exam: total,
            totalInternal: 0,
            totalExam: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { transaction }
        );

        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          if (coMapping[coId]) {
            semesterScores[coId] += level;
            await MarksCoMapping.create(
              {
                mark_id: newMark.id,
                coId: coId,
                internal: 0,
                exam: total,
                totalInternal: 0,
                totalExam: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { transaction }
            );
          }
        }
        studentCount++;
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        if (coMapping[coId]) {
          const seeValue =
            studentCount > 0 ? semesterScores[coId] / studentCount : 0;
          coAttainment.see[coId] = Math.min(Math.max(seeValue, 1), 3);
        }
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const directValue =
          coAttainment.cia[coId] * parameters.y +
          coAttainment.see[coId] * parameters.x;
        coAttainment.direct[coId] = Math.min(Math.max(directValue, 1), 3);
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const indirectValue =
          (coAttainment.seminar[coId] + coAttainment.workProject[coId]) / 2;
        coAttainment.indirect[coId] = Math.min(Math.max(indirectValue, 1), 3);
      }

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const overallValue =
          coAttainment.direct[coId] * parameters.u +
          coAttainment.indirect[coId] * parameters.v;
        coAttainment.overall[coId] = Math.min(Math.max(overallValue, 1), 3);
        targetAttained[coId] =
          coAttainment.overall[coId] >= parameters.targetAttainmentLevel;
      }

      await transaction.commit();
      res.json({ coAttainment, targetAttained, parameters });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({
        error: "Failed to process semester results: " + error.message,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to upload semester results: " + error.message });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  updateMarks,
  updateCourseOutcomes,
  deleteStudent,
  calculateCoPoAttainment,
  uploadSemesterResults,
};
