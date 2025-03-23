const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  validateStudentInput,
  validateMarksUpdate,
} = require("../middleware/validateMiddleware");
const {
  getAllStudents,
  addStudent,
  updateMarks,
  deleteStudent,
  calculateCoPoAttainment,
} = require("../controllers/studentController");

// Routes
router.get("/", authenticateToken, getAllStudents);
router.post("/", authenticateToken, validateStudentInput, addStudent);
router.put("/:studentId", authenticateToken, validateMarksUpdate, updateMarks);
router.delete("/:studentId", authenticateToken, deleteStudent);
router.get(
  "/calculate-co-po/:studentId",
  authenticateToken,
  calculateCoPoAttainment
);

module.exports = router;
