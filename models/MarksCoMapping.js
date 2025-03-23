module.exports = (sequelize, DataTypes) => {
  const MarksCoMapping = sequelize.define(
    "MarksCoMapping",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      mark_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coId: {
        // Change to camelCase to match payload
        type: DataTypes.STRING, // Change to STRING
        allowNull: false,
        field: "co_id",
      },
      internal: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      exam: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      totalInternal: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      totalExam: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      createdAt: {
        // Add missing fields
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "marks_co_mapping",
    }
  );

  MarksCoMapping.associate = (models) => {
    MarksCoMapping.belongsTo(models.Mark, { foreignKey: "mark_id" });
    // Remove the CourseOutcome association
    // MarksCoMapping.belongsTo(models.CourseOutcome, { foreignKey: "coId" });
  };

  return MarksCoMapping;
};
