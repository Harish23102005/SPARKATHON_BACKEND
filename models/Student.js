module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    "Student",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        // New field
        type: DataTypes.STRING,
        allowNull: false,
      },
      average: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
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
    Student.hasMany(models.Mark, {
      foreignKey: "student_id",
      sourceKey: "student_id",
    });
    Student.hasMany(models.CourseOutcome, {
      foreignKey: "student_id",
      sourceKey: "student_id",
    });
  };

  return Student;
};
