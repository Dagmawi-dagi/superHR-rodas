'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('donation_item_adjustment_requests', 'interval_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'donation_item_intervals',
        key: 'interval_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'donation_item_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('donation_item_adjustment_requests', 'interval_id');
  }
};
