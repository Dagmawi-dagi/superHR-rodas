'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('donation_items', 'per_recurring_value', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      after: 'total_value'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('donation_items', 'per_recurring_value');
  }
};
