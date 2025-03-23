// CourseOutcome.js
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
      co_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      target: {
        type: DataTypes.DECIMAL(5, 2),
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
    CourseOutcome.hasMany(models.CoPoMapping, { foreignKey: "co_id" });
    CourseOutcome.hasMany(models.MarksCoMapping, { foreignKey: "co_id" });
  };

  return CourseOutcome;
};
