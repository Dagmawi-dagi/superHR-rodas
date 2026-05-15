'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Rename 'amount' to 'value' in donation_item_intervals
      await queryInterface.renameColumn('donation_item_intervals', 'amount', 'value', { transaction: t });

      // 2. Add 'quantity' to donation_item_intervals
      await queryInterface.addColumn('donation_item_intervals', 'quantity', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 1.00
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn('donation_item_intervals', 'value', 'amount', { transaction: t });
      await queryInterface.removeColumn('donation_item_intervals', 'quantity', { transaction: t });
    });
  }
};
