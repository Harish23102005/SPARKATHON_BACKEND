const {
  Student,
  Mark,
  MarksCoMapping,
  CourseOutcome,
  CoPoMapping,
} = require("../models");

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
        { model: CoPoMapping },
      ],
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

const addStudent = async (req, res) => {
  const transaction = await Student.sequelize.transaction(); // Start a transaction
  try {
    const { studentId, name, department, marks, courseOutcomes, coPoMapping } =
      req.body;

    // Map studentId to student_id
    const studentData = {
      student_id: studentId,
      name,
      department,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if student_id already exists
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

    // Create the student
    const newStudent = await Student.create(studentData, { transaction });

    // Create marks and associated coMapping
    if (marks && marks.length > 0) {
      await Promise.all(
        marks.map(async (mark) => {
          const newMark = await Mark.create(
            {
              student_id: studentId,
              year: mark.year,
              internal: mark.internal,
              exam: mark.exam,
              totalInternal: mark.totalInternal,
              totalExam: mark.totalExam,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );

          if (mark.coMapping && mark.coMapping.length > 0) {
            await Promise.all(
              mark.coMapping.map(async (coMap) => {
                await MarksCoMapping.create(
                  {
                    mark_id: newMark.id,
                    coId: coMap.coId,
                    internal: coMap.internal,
                    exam: coMap.exam,
                    totalInternal: coMap.totalInternal,
                    totalExam: coMap.totalExam,
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

    // Create course outcomes
    if (courseOutcomes && courseOutcomes.length > 0) {
      await Promise.all(
        courseOutcomes.map(async (co) => {
          await CourseOutcome.create(
            {
              student_id: studentId,
              coId: co.coId, // This should now work with the updated model
              target: co.target,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );
        })
      );
    }

    // Create CO-PO mappings
    if (coPoMapping && coPoMapping.length > 0) {
      await Promise.all(
        coPoMapping.map(async (mapping) => {
          await CoPoMapping.create(
            {
              student_id: studentId,
              coId: mapping.coId,
              poMapping: mapping.poMapping,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );
        })
      );
    }

    // Fetch the newly created student with associations
    const createdStudent = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
        { model: CoPoMapping },
      ],
      transaction,
    });

    await transaction.commit(); // Commit the transaction
    res
      .status(201)
      .json({ message: "Student added successfully", student: createdStudent });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("Error creating student:", error);
    res
      .status(500)
      .json({ error: "Failed to create student: " + error.message });
  }
};

const updateMarks = async (req, res) => {
  const transaction = await Student.sequelize.transaction();
  try {
    const { studentId } = req.params;
    const { marks } = req.body;

    const student = await Student.findOne({
      where: { student_id: studentId },
      transaction,
    });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    // Delete existing marks and coMappings
    await Mark.destroy({ where: { student_id: studentId }, transaction });

    // Create new marks and coMappings
    if (marks && marks.length > 0) {
      await Promise.all(
        marks.map(async (mark) => {
          const newMark = await Mark.create(
            {
              student_id: studentId,
              year: mark.year,
              internal: mark.internal,
              exam: mark.exam,
              totalInternal: mark.totalInternal,
              totalExam: mark.totalExam,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { transaction }
          );

          if (mark.coMapping && mark.coMapping.length > 0) {
            await Promise.all(
              mark.coMapping.map(async (coMap) => {
                await MarksCoMapping.create(
                  {
                    mark_id: newMark.id,
                    coId: coMap.coId,
                    internal: coMap.internal,
                    exam: coMap.exam,
                    totalInternal: coMap.totalInternal,
                    totalExam: coMap.totalExam,
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

    const updatedStudent = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
        { model: CoPoMapping },
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
    console.error("Error updating marks:", error);
    res.status(500).json({ error: "Failed to update marks" });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
};

const calculateCoPoAttainment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [
        { model: Mark, include: [MarksCoMapping] },
        { model: CourseOutcome },
        { model: CoPoMapping },
      ],
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Calculate CO attainment
    const coSummary = [];
    for (const mark of student.Marks) {
      for (const coMap of mark.MarksCoMappings) {
        const internalAttainment =
          coMap.totalInternal !== 0
            ? (coMap.internal / coMap.totalInternal) * 100
            : 0;
        const examAttainment =
          coMap.totalExam !== 0 ? (coMap.exam / coMap.totalExam) * 100 : 0;
        const avgAttainment = (internalAttainment + examAttainment) / 2;
        coSummary.push({
          coId: coMap.coId,
          avgAttainment,
        });
      }
    }

    // Calculate PO attainment
    const poSummary = [];
    for (const mapping of student.CoPoMappings) {
      const coAttainment =
        coSummary.find((co) => co.coId === mapping.coId)?.avgAttainment || 0;
      for (const po of mapping.poMapping) {
        const poAttainment = coAttainment * (po.weight / 3);
        poSummary.push({
          poId: po.poId,
          avgAttainment: poAttainment,
        });
      }
    }

    res.json({ coSummary, poSummary });
  } catch (error) {
    console.error("Error calculating CO/PO:", error);
    res.status(500).json({ error: "Failed to calculate CO/PO" });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  updateMarks,
  deleteStudent,
  calculateCoPoAttainment,
};
