module.exports = (sequelize, DataTypes) => {
  const CourseOutcome = sequelize.define(
    "CourseOutcome",
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
      },
      coId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      target: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: "course_outcomes",
    }
  );

  CourseOutcome.associate = (models) => {
    CourseOutcome.belongsTo(models.Student, {
      foreignKey: "student_id",
      targetKey: "student_id",
    });
  };

  return CourseOutcome;
};
