"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donations", {
      donation_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "donation_companies",
          key: "company_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      campaign_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "campaigns",
          key: "campaign_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      donation_date: {
        type: Sequelize.DATEONLY,
      },
      total_value: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM(
          "draft",
          "pending",
          "approved",
          "distributed",
          "cancelled",
        ),
        defaultValue: "draft",
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("donations");
  },
};
