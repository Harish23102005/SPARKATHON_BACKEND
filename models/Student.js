// models/Student.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define(
  "Student",
  {
    student_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marks: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    course_outcomes: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    average: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "students",
    timestamps: false,
  }
);

module.exports = Student;
