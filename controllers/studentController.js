const { Op } = require("sequelize");
const models = require("../models");

const getAllStudents = async (req, res) => {
  try {
    const students = await models.Student.findAll({
      include: [
        {
          model: models.Mark,
          include: [
            {
              model: models.MarksCoMapping,
              include: [
                {
                  model: models.CourseOutcome,
                  include: [{ model: models.CoPoMapping }],
                },
              ],
            },
          ],
        },
        {
          model: models.CourseOutcome,
          include: [{ model: models.CoPoMapping }],
        },
      ],
    });

    const formattedStudents = students.map((student) => ({
      studentId: student.student_id,
      name: student.name,
      department: student.department, // New field
      average: student.average,
      marks: student.Marks.map((mark) => ({
        id: mark.id,
        year: mark.year, // New field
        internal: mark.internal, // New field
        exam: mark.exam, // New field
        totalInternal: mark.totalInternal, // New field
        totalExam: mark.totalExam, // New field
        coMapping: mark.MarksCoMappings.map((mcm) => ({
          coId: `CO${mcm.CourseOutcome.co_id}`, // Format as "CO1"
          internal: mcm.internal,
          exam: mcm.exam,
          totalInternal: mcm.totalInternal,
          totalExam: mcm.totalExam,
        })),
      })),
      courseOutcomes: student.CourseOutcomes.map((co) => ({
        coId: `CO${co.co_id}`,
        description: co.description,
        target: co.target,
      })),
      coPoMapping: student.CourseOutcomes.map((co) => ({
        coId: `CO${co.co_id}`,
        poMapping: co.CoPoMappings.map((cpm) => ({
          poId: cpm.po_id,
          weight: cpm.weight,
        })),
      })),
    }));

    res.json(formattedStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addStudent = async (req, res) => {
  const { studentId, name, department, marks, courseOutcomes, coPoMapping } =
    req.body;

  try {
    // Create student
    const student = await models.Student.create({
      student_id: studentId,
      name,
      department, // New field
      average: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create marks
    const mark = await models.Mark.create({
      student_id: studentId,
      year: marks[0].year, // New field
      internal: marks[0].internal, // New field
      exam: marks[0].exam, // New field
      totalInternal: marks[0].totalInternal, // New field
      totalExam: marks[0].totalExam, // New field
      timestamp: new Date(),
    });

    // Create course outcomes
    const coRecords = await models.CourseOutcome.bulkCreate(
      courseOutcomes.map((co) => ({
        student_id: studentId,
        co_id: co.coId.replace("CO", ""), // Store as "1" instead of "CO1"
        description: co.description || `Understand ${co.coId}`,
        target: co.target,
      }))
    );

    // Create CO-PO mappings
    await models.CoPoMapping.bulkCreate(
      coPoMapping.flatMap((coMap, index) =>
        coMap.poMapping.map((po) => ({
          co_id: coRecords[index].id,
          po_id: po.poId,
          weight: po.weight,
        }))
      )
    );

    // Create marks-CO mappings
    await models.MarksCoMapping.bulkCreate(
      marks[0].coMapping.map((co, index) => ({
        mark_id: mark.id,
        co_id: coRecords[index].id,
        internal: co.internal,
        exam: co.exam,
        totalInternal: co.totalInternal,
        totalExam: co.totalExam,
      }))
    );

    // Update average
    const studentMarks = await models.Mark.findAll({
      where: { student_id: studentId },
    });
    const avg =
      studentMarks.reduce((sum, m) => {
        const internalPercent = (m.internal / m.totalInternal) * 100;
        const examPercent = (m.exam / m.totalExam) * 100;
        return sum + (internalPercent + examPercent) / 2;
      }, 0) / studentMarks.length;
    await student.update({ average: avg.toFixed(2) });

    res.status(201).json({ message: "Student added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMarks = async (req, res) => {
  const { studentId } = req.params;
  const { marks, courseOutcomes } = req.body;

  try {
    // Create new marks entry
    const mark = await models.Mark.create({
      student_id: studentId,
      year: marks.year,
      internal: marks.internal,
      exam: marks.exam,
      totalInternal: marks.totalInternal,
      totalExam: marks.totalExam,
      timestamp: new Date(),
    });

    // Update course outcomes targets
    for (const co of courseOutcomes) {
      await models.CourseOutcome.update(
        { target: co.target },
        { where: { student_id: studentId, co_id: co.coId.replace("CO", "") } }
      );
    }

    // Create marks-CO mappings
    const coRecords = await models.CourseOutcome.findAll({
      where: { student_id: studentId },
    });
    await models.MarksCoMapping.bulkCreate(
      marks.coMapping.map((co) => {
        const coRecord = coRecords.find((c) => `CO${c.co_id}` === co.coId);
        return {
          mark_id: mark.id,
          co_id: coRecord ? coRecord.id : null,
          internal: co.internal,
          exam: co.exam,
          totalInternal: co.totalInternal,
          totalExam: co.totalExam,
        };
      })
    );

    // Update average
    const studentMarks = await models.Mark.findAll({
      where: { student_id: studentId },
    });
    const avg =
      studentMarks.reduce((sum, m) => {
        const internalPercent = (m.internal / m.totalInternal) * 100;
        const examPercent = (m.exam / m.totalExam) * 100;
        return sum + (internalPercent + examPercent) / 2;
      }, 0) / studentMarks.length;
    await models.Student.update(
      { average: avg.toFixed(2) },
      { where: { student_id: studentId } }
    );

    res.json({ message: "Marks updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    await models.Student.destroy({ where: { student_id: studentId } });
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const calculateCoPoAttainment = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Fetch CO attainment
    const courseOutcomes = await models.CourseOutcome.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: models.MarksCoMapping,
          include: [{ model: models.Mark }],
        },
      ],
    });

    const coAttainment = {};
    courseOutcomes.forEach((co) => {
      coAttainment[`CO${co.co_id}`] = co.MarksCoMappings.map((mcm) => {
        const internalPercent =
          mcm.internal && mcm.totalInternal
            ? (mcm.internal / mcm.totalInternal) * 100
            : 0;
        const examPercent =
          mcm.exam && mcm.totalExam ? (mcm.exam / mcm.totalExam) * 100 : 0;
        return (internalPercent + examPercent) / 2;
      });
    });

    const coSummary = Object.keys(coAttainment).map((coId) => ({
      coId,
      avgAttainment: coAttainment[coId].length
        ? (
            coAttainment[coId].reduce((sum, a) => sum + a, 0) /
            coAttainment[coId].length
          ).toFixed(2)
        : 0,
    }));

    // Fetch PO attainment
    const coPoMappings = await models.CoPoMapping.findAll({
      include: [
        {
          model: models.CourseOutcome,
          where: { student_id: studentId },
        },
      ],
    });

    const poAttainment = {};
    coPoMappings.forEach((cpm) => {
      if (!poAttainment[cpm.po_id]) poAttainment[cpm.po_id] = [];
      const coAttain =
        coSummary.find((c) => c.coId === `CO${cpm.CourseOutcome.co_id}`)
          ?.avgAttainment || 0;
      poAttainment[cpm.po_id].push(coAttain * (cpm.weight / 3)); // Assuming max weight is 3
    });

    const poSummary = Object.keys(poAttainment).map((poId) => ({
      poId,
      avgAttainment: poAttainment[poId].length
        ? (
            poAttainment[poId].reduce((sum, a) => sum + a, 0) /
            poAttainment[poId].length
          ).toFixed(2)
        : 0,
    }));

    res.json({ coSummary, poSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  updateMarks,
  deleteStudent,
  calculateCoPoAttainment,
};
