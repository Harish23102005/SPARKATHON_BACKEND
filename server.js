require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Initialize express app
const app = express();

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];
console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(
          `CORS Error: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins}`
        );
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

// Import routes
const authRoutes = require("./Backend/routes/authRoutes");
const studentRoutes = require("./Backend/routes/studentRoutes");

// Routes
app.use("/api", authRoutes);
app.use("/api/students", studentRoutes);

// Import database and models
const sequelize = require("./Backend/config/database");
const { User } = require("./Backend/models");

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
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
