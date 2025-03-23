const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const models = {
  User: require("./User")(sequelize, DataTypes),
  Student: require("./Student")(sequelize, DataTypes),
  Mark: require("./Mark")(sequelize, DataTypes),
  MarksCoMapping: require("./MarksCoMapping")(sequelize, DataTypes),
  CourseOutcome: require("./CourseOutcome")(sequelize, DataTypes),
  CoPoMapping: require("./CoPoMapping")(sequelize, DataTypes),
};

// Set up associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
