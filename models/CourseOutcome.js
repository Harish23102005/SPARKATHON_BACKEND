// models/CourseOutcome.js
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
        field: "co_id",
      },
      target: {
        type: DataTypes.FLOAT,
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
    CourseOutcome.belongsTo(models.Student, { foreignKey: "student_id" });
    CourseOutcome.hasMany(models.CoPoMapping, {
      foreignKey: "coId",
      sourceKey: "coId", // Specify that coId in CoPoMapping references the coId field in CourseOutcome
    });
  };

  return CourseOutcome;
};
