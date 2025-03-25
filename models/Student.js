// models/Student.js
module.exports = (sequelize, DataTypes) => {
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

  // Define associations (if any)
  Student.associate = (models) => {
    // Example: Student.hasMany(models.Mark);
    // Add associations based on your schema
  };

  return Student;
};
