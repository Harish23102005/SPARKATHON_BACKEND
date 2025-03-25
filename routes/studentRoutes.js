// routes/studentRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const studentController = require("../controllers/studentController");

module.exports = (models) => {
  const { Student } = models;
  const router = express.Router();

  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Access denied" });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret",
      (err, user) => {
        if (err) {
          console.log("Token verification failed:", err.message);
          return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
      }
    );
  };

  router.get("/", authenticateToken, studentController.getAllStudents);
  router.post("/", authenticateToken, studentController.addStudent);
  router.put(
    "/:studentId/marks",
    authenticateToken,
    studentController.updateMarks
  );
  router.put(
    "/:studentId/course-outcomes",
    authenticateToken,
    studentController.updateCourseOutcomes
  );
  router.delete(
    "/:studentId",
    authenticateToken,
    studentController.deleteStudent
  );
  router.get(
    "/:studentId/co-po",
    authenticateToken,
    studentController.calculateCoPoAttainment
  );
  router.post(
    "/upload",
    authenticateToken,
    studentController.uploadSemesterResults
  );

  return router;
};
