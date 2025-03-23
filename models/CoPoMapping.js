// CoPoMapping.js
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
      co_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      po_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      weight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "co_po_mapping",
    }
  );

  CoPoMapping.associate = (models) => {
    CoPoMapping.belongsTo(models.CourseOutcome, { foreignKey: "co_id" });
  };

  return CoPoMapping;
};
