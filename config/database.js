// database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "student_performance",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "#Harish_23", // Replace with your actual password
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Disable logging for cleaner console output (optional)
  }
);

sequelize
  .authenticate()
  .then(() => console.log("✅ MySQL Database Connected!"))
  .catch((err) => console.error("❌ Database Connection Failed:", err));

module.exports = sequelize;
