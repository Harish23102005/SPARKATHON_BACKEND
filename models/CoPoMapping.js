// models/CoPoMapping.js
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
        type: DataTypes.STRING,
        allowNull: false,
        field: "co_id",
      },
      poMapping: {
        type: DataTypes.JSONB,
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
      tableName: "co_po_mapping",
    }
  );

  CoPoMapping.associate = (models) => {
    CoPoMapping.belongsTo(models.Student, { foreignKey: "student_id" });
    CoPoMapping.belongsTo(models.CourseOutcome, { foreignKey: "coId" });
  };

  return CoPoMapping;
};
