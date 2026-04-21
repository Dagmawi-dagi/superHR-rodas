"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donation_distributions", {
      distribution_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      donation_item_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "donation_items",
          key: "donation_item_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      beneficiary_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "beneficiaries",
          key: "beneficiary_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
      },
      value: {
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
    await queryInterface.dropTable("donation_distributions");
  },
};
