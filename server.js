// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Initialize express app
const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://student-performance-tracker-frontend.vercel.app",
].filter((origin, index, self) => self.indexOf(origin) === index);

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

// Import sequelize and initialize models
let sequelize;
try {
  sequelize = require("./config/database");
} catch (error) {
  console.error("Failed to load sequelize:", error.message);
  console.error("Error stack:", error.stack);
  process.exit(1);
}

// Import models after sequelize is initialized
let models;
try {
  models = require("./models");
  console.log("Models loaded:", Object.keys(models));
} catch (error) {
  console.error("Failed to load models:", error.message);
  console.error("Error stack:", error.stack);
  process.exit(1);
}

const { User } = models;

// Import routes
let authRoutes, studentRoutes;
try {
  authRoutes = require("./routes/authRoutes");
  studentRoutes = require("./routes/studentRoutes")(models);
} catch (error) {
  console.error("Failed to load routes:", error.message);
  console.error("Error stack:", error.stack);
  process.exit(1);
}

// Routes
app.use("/api", authRoutes);
app.use("/api/students", studentRoutes);

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

    await sequelize.sync({ force: true }); // Temporarily set to true to recreate tables
    console.log("Database synced successfully");

    app.listen(PORT, async () => {
      console.log(`✅ Backend server running on port ${PORT}`);
      await seedDefaultUser();
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
};

startServer();
