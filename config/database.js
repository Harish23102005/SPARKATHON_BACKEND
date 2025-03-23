require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Disable logging for cleaner console output (optional)
});

sequelize
  .authenticate()
  .then(() => console.log("✅ PostgreSQL Database Connected!"))
  .catch((err) => console.error("❌ Database Connection Failed:", err));

module.exports = sequelize;
