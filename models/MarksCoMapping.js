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
      co_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      internal: {
        // New field
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      exam: {
        // New field
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      totalInternal: {
        // New field
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      totalExam: {
        // New field
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
    },
    {
      tableName: "marks_co_mapping",
    }
  );

  MarksCoMapping.associate = (models) => {
    MarksCoMapping.belongsTo(models.Mark, { foreignKey: "mark_id" });
    MarksCoMapping.belongsTo(models.CourseOutcome, { foreignKey: "co_id" });
  };

  return MarksCoMapping;
};
