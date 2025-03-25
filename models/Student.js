// models/Student.js
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    "Student",
    {
      student_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      average: {
        type: DataTypes.FLOAT, // Changed from STRING
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "students",
    }
  );

  Student.associate = (models) => {
    Student.hasMany(models.CourseOutcome, { foreignKey: "student_id" });
    Student.hasMany(models.Mark, { foreignKey: "student_id" }); // Assuming this from schema
  };

  return Student;
};
