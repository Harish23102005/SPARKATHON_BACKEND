const { Sequelize } = require("sequelize");

// Initialize Sequelize using the DATABASE_URL environment variable
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for Render's PostgreSQL
    },
  },
  logging: false, // Disable logging for cleaner console output (optional)
  pool: {
    max: 5, // Maximum number of connections in pool
    min: 0, // Minimum number of connections in pool
    acquire: 30000, // Maximum time (ms) to acquire a connection
    idle: 10000, // Maximum time (ms) a connection can be idle
  },
});

module.exports = sequelize;
