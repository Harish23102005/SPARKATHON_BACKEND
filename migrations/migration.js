"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create Students table
    await queryInterface.createTable("students", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      average: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create Marks table
    await queryInterface.createTable("marks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "students",
          key: "student_id",
        },
      },
      year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      internal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      exam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalInternal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalExam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create MarksCoMappings table
    await queryInterface.createTable("marks_co_mappings", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      mark_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "marks",
          key: "id",
        },
      },
      coId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      internal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      exam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalInternal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalExam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create CourseOutcomes table
    await queryInterface.createTable("course_outcomes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "students",
          key: "student_id",
        },
      },
      coId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create CoPoMappings table
    await queryInterface.createTable("co_po_mappings", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "students",
          key: "student_id",
        },
      },
      coId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      poMapping: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("co_po_mappings");
    await queryInterface.dropTable("course_outcomes");
    await queryInterface.dropTable("marks_co_mappings");
    await queryInterface.dropTable("marks");
    await queryInterface.dropTable("students");
    await queryInterface.dropTable("Users");
  },
};
