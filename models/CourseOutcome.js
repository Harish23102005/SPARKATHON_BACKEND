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
      indexes: [
        {
          unique: true,
          fields: ["student_id", "co_id"], // Composite unique constraint
        },
      ],
    }
  );

  CourseOutcome.associate = (models) => {
    CourseOutcome.belongsTo(models.Student, { foreignKey: "student_id" });
    // Removed: CourseOutcome.hasMany(models.CoPoMapping, { foreignKey: "coId", sourceKey: "coId" });
  };

  return CourseOutcome;
};
