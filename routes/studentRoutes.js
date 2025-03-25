// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Student } = require("../models");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret",
    (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    }
  );
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const students = await Student.findAll();
    console.log("Returning students:", students);

    // Transform the data to match the frontend's expectations
    const transformedStudents = students.map((student) => {
      const studentData = student.toJSON();

      // Calculate average if null
      if (
        !studentData.average &&
        studentData.marks &&
        studentData.marks.length > 0
      ) {
        const marks = studentData.marks[0];
        const totalMarks = (marks.internal || 0) + (marks.exam || 0);
        const totalPossible =
          (marks.totalInternal || 0) + (marks.totalExam || 0);
        studentData.average =
          totalPossible > 0
            ? ((totalMarks / totalPossible) * 100).toFixed(2)
            : null;
      }

      return {
        student_id: studentData.student_id,
        name: studentData.name,
        department: studentData.department,
        marks: studentData.marks || [],
        course_outcomes: studentData.course_outcomes || [],
        average: studentData.average,
      };
    });

    res.json(transformedStudents);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { studentId, name, department, marks, courseOutcomes } = req.body;
  try {
    const student = await Student.create({
      student_id: studentId,
      name,
      department,
      marks,
      course_outcomes: courseOutcomes,
    });

    // Calculate average
    let average = null;
    if (marks && marks.length > 0) {
      const mark = marks[0];
      const totalMarks = (mark.internal || 0) + (mark.exam || 0);
      const totalPossible = (mark.totalInternal || 0) + (mark.totalExam || 0);
      average =
        totalPossible > 0
          ? ((totalMarks / totalPossible) * 100).toFixed(2)
          : null;
    }
    student.average = average;
    await student.save();

    res.json({
      message: "Student added successfully",
      student: student.toJSON(),
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Failed to add student" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { marks } = req.body;
  try {
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    student.marks = marks;

    // Calculate average
    let average = null;
    if (marks && marks.length > 0) {
      const mark = marks[0];
      const totalMarks = (mark.internal || 0) + (mark.exam || 0);
      const totalPossible = (mark.totalInternal || 0) + (mark.totalExam || 0);
      average =
        totalPossible > 0
          ? ((totalMarks / totalPossible) * 100).toFixed(2)
          : null;
    }
    student.average = average;

    await student.save();
    res.json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

module.exports = router;
