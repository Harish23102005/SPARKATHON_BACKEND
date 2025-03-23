// models/index.js
const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const models = {
  Student: require("./Student")(sequelize, Sequelize.DataTypes),
  User: require("./User")(sequelize, Sequelize.DataTypes),
  Mark: require("./Mark")(sequelize, Sequelize.DataTypes),
  CourseOutcome: require("./CourseOutcome")(sequelize, Sequelize.DataTypes),
  CoPoMapping: require("./CoPoMapping")(sequelize, Sequelize.DataTypes),
  MarksCoMapping: require("./MarksCoMapping")(sequelize, Sequelize.DataTypes),
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
