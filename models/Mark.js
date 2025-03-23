module.exports = (sequelize, DataTypes) => {
  const Mark = sequelize.define(
    "Mark",
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
      year: {
        // New field
        type: DataTypes.STRING,
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
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "marks",
    }
  );

  Mark.associate = (models) => {
    Mark.belongsTo(models.Student, {
      foreignKey: "student_id",
      targetKey: "student_id",
    });
    Mark.hasMany(models.MarksCoMapping, { foreignKey: "mark_id" });
  };

  return Mark;
};
