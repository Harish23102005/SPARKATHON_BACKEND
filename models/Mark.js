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
        type: DataTypes.STRING,
        allowNull: false,
      },
      internal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      exam: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalInternal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalExam: {
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
      tableName: "marks",
    }
  );

  Mark.associate = (models) => {
    Mark.belongsTo(models.Student, {
      foreignKey: "student_id",
      targetKey: "student_id",
    });
    Mark.hasMany(models.MarksCoMapping, {
      foreignKey: "mark_id",
      sourceKey: "id",
    });
  };

  return Mark;
};
