module.exports = (sequelize, DataTypes) => {
  const CoPoMapping = sequelize.define(
    "CoPoMapping",
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
        type: DataTypes.STRING, // Changed to STRING to match frontend
        allowNull: false,
        field: "co_id",
      },
      poId: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: "po_id",
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
      tableName: "co_po_mapping",
    }
  );

  CoPoMapping.associate = (models) => {
    CoPoMapping.belongsTo(models.Student, { foreignKey: "student_id" });
    CoPoMapping.belongsTo(models.CourseOutcome, { foreignKey: "coId" });
  };

  return CoPoMapping;
};
