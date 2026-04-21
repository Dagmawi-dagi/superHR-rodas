"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donation_items", {
      donation_item_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      donation_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "donations",
          key: "donation_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("money", "goods", "service"),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
      },
      unit_value: {
        type: Sequelize.DECIMAL(15, 2),
      },
      total_value: {
        type: Sequelize.DECIMAL(15, 2),
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
    await queryInterface.dropTable("donation_items");
  },
};
