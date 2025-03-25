// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { RandomForestClassifier } = require("ml-random-forest");

// Initialize express app
const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://student-performance-tracker-frontend.vercel.app",
];

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} not allowed.`);
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json());

// Import routes and database
let authRoutes, studentRoutes, sequelize, User, Student;
try {
  authRoutes = require("./routes/authRoutes");
  studentRoutes = require("./routes/studentRoutes");
  sequelize = require("./config/database");
  ({ User, Student } = require("./models"));
} catch (error) {
  console.error("Failed to load required modules:", error.message);
  process.exit(1);
}

// Routes
app.use("/api", authRoutes);
app.use("/api/students", studentRoutes);

// ML Model Setup
let rfModel;
const trainModel = async () => {
  try {
    // Fetch student data for training
    const students = await Student.findAll();
    if (students.length === 0) {
      console.log("No student data available for training ML model");
      return;
    }

    // Prepare training data
    const trainingData = [];
    const labels = [];
    students.forEach((student) => {
      if (student.marks && student.marks.length > 0) {
        const marks = student.marks[0];
        const internal = marks.internal || 0;
        const exam = marks.exam || 0;
        const totalInternal = marks.totalInternal || 0;
        const totalExam = marks.totalExam || 0;

        // Features: internal marks, exam marks, total internal, total exam
        trainingData.push([internal, exam, totalInternal, totalExam]);

        // Label: 1 if average >= 50 (pass), 0 if average < 50 (fail)
        const average =
          student.average ||
          ((internal + exam) / (totalInternal + totalExam)) * 100;
        labels.push(average >= 50 ? 1 : 0);
      }
    });

    if (trainingData.length === 0) {
      console.log("No valid training data available for ML model");
      return;
    }

    // Train Random Forest model
    const options = {
      seed: 42,
      maxFeatures: 0.8,
      replacement: true,
      nEstimators: 50,
    };
    rfModel = new RandomForestClassifier(options);
    rfModel.train(trainingData, labels);
    console.log("ML model trained successfully");
  } catch (error) {
    console.error("Error training ML model:", error);
  }
};

// Predict endpoint
app.post("/api/predict", async (req, res) => {
  const { internal, exam, totalInternal, totalExam } = req.body;

  try {
    if (!rfModel) {
      return res.status(400).json({ error: "ML model not trained yet" });
    }

    const prediction = rfModel.predict([
      [internal, exam, totalInternal, totalExam],
    ]);
    const result = prediction[0] === 1 ? "Pass" : "Fail";
    res.json({ prediction: result });
  } catch (error) {
    console.error("Error making prediction:", error);
    res.status(500).json({ error: "Failed to make prediction" });
  }
});

// Seed a default user
const seedDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({
      where: { email: "admin@example.com" },
    });
    if (!existingUser) {
      await User.create({
        email: "admin@example.com",
        password: await bcrypt.hash("password123", 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Default admin user created");
    } else {
      console.log("Default admin user already exists");
    }
  } catch (error) {
    console.error("Error seeding default user:", error);
  }
};

// Start the server with database connection
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync({ force: false });
    console.log("Database synced successfully");

    app.listen(PORT, async () => {
      console.log(`✅ Backend server running on port ${PORT}`);
      await seedDefaultUser();
      await trainModel(); // Train ML model on startup
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
};

startServer();
