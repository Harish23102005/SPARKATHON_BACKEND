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
      },
      poMapping: {
        type: DataTypes.JSON, // Store poMapping as JSON
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
      tableName: "co_po_mappings",
    }
  );

  CoPoMapping.associate = (models) => {
    CoPoMapping.belongsTo(models.Student, {
      foreignKey: "student_id",
      targetKey: "student_id",
    });
  };

  return CoPoMapping;
};
