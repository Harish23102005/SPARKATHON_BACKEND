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
        type: DataTypes.INTEGER, // Changed to INTEGER
        allowNull: false,
        field: "co_id",
      },
      poId: {
        type: DataTypes.STRING(10), // Matches varchar(10)
        allowNull: false,
        field: "po_id",
      },
      weight: {
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
      tableName: "co_po_mapping",
    }
  );

  CoPoMapping.associate = (models) => {
    CoPoMapping.belongsTo(models.Student, { foreignKey: "student_id" });
    CoPoMapping.belongsTo(models.CourseOutcome, { foreignKey: "coId" }); // Adjust model name
  };

  return CoPoMapping;
};
