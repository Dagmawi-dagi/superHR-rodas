'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Add columns to donation_item_intervals
      await queryInterface.addColumn('donation_item_intervals', 'amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      }, { transaction: t });

      await queryInterface.addColumn('donation_item_intervals', 'payment_method', {
        type: Sequelize.ENUM('bank', 'cash'),
        defaultValue: 'bank',
      }, { transaction: t });

      await queryInterface.addColumn('donation_item_intervals', 'payment_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      }, { transaction: t });

      await queryInterface.addColumn('donation_item_intervals', 'distribution_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      }, { transaction: t });

      // 2. Remove per_recurring_value from donation_items (added in previous turn)
      const tableInfo = await queryInterface.describeTable('donation_items');
      if (tableInfo.per_recurring_value) {
        await queryInterface.removeColumn('donation_items', 'per_recurring_value', { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('donation_item_intervals', 'amount', { transaction: t });
      await queryInterface.removeColumn('donation_item_intervals', 'payment_method', { transaction: t });
      await queryInterface.removeColumn('donation_item_intervals', 'payment_date', { transaction: t });
      await queryInterface.removeColumn('donation_item_intervals', 'distribution_date', { transaction: t });
      
      // Optionally add back per_recurring_value if we want a perfect rollback
      await queryInterface.addColumn('donation_items', 'per_recurring_value', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      }, { transaction: t });
    });
  }
};
