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

  Student.associate = (models) => {
    Student.hasMany(models.Mark, { foreignKey: "student_id" });
    Student.hasMany(models.CourseOutcome, { foreignKey: "student_id" });
    Student.hasMany(models.CoPoMapping, { foreignKey: "student_id" });
  };

  return Student;
};
