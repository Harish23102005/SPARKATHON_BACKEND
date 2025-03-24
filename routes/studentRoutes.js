const express = require("express");
const router = express.Router();
const multer = require("multer");
const authenticateToken = require("../middleware/authMiddleware");
const {
  validateStudentInput,
  validateMarksUpdate,
} = require("../middleware/validateMiddleware");
const {
  getAllStudents,
  addStudent,
  updateMarks,
  updateCourseOutcomes, // Add the new controller function
  deleteStudent,
  calculateCoPoAttainment,
  uploadSemesterResults,
} = require("../controllers/studentController");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get("/", authenticateToken, getAllStudents);
router.post("/", authenticateToken, validateStudentInput, addStudent);
router.put("/:studentId", authenticateToken, validateMarksUpdate, updateMarks);
router.put(
  "/:studentId/course-outcomes",
  authenticateToken,
  updateCourseOutcomes
); // New route
router.delete("/:studentId", authenticateToken, deleteStudent);
router.get(
  "/calculate-co-po/:studentId",
  authenticateToken,
  calculateCoPoAttainment
);

// Route for uploading semester results
router.post(
  "/upload-semester-results",
  authenticateToken,
  upload.fields([
    { name: "internal", maxCount: 1 },
    { name: "assignment", maxCount: 1 },
    { name: "classTest", maxCount: 1 },
    { name: "semester", maxCount: 1 },
  ]),
  uploadSemesterResults
);

module.exports = router;
