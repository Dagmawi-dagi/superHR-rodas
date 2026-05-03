'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_item_intervals', {
      interval_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      donation_item_id: {
        type: Sequelize.INTEGER,
        references: { model: 'donation_items', key: 'donation_item_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      interval_type: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: false,
      },
      interval_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'completed'),
        defaultValue: 'pending',
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
    await queryInterface.dropTable('donation_item_intervals');
  },
};