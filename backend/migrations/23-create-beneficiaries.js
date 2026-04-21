"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("beneficiaries", {
      beneficiary_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM("individual", "group", "organization"),
      },
      name: {
        type: Sequelize.STRING(200),
      },
      contact_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      location_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "donation_locations",
          key: "location_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("beneficiaries");
  },
};
