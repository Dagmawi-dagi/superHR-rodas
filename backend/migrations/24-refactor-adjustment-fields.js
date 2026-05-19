'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Add item_type
      await queryInterface.addColumn('donation_item_adjustment_requests', 'item_type', {
        type: Sequelize.ENUM('money', 'goods', 'service'),
        allowNull: false,
        defaultValue: 'money'
      }, { transaction: t });

      // 2. Rename 'amount' to 'quantity'
      await queryInterface.renameColumn('donation_item_adjustment_requests', 'amount', 'quantity', { transaction: t });

      // 3. Add 'value'
      await queryInterface.addColumn('donation_item_adjustment_requests', 'value', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('donation_item_adjustment_requests', 'item_type', { transaction: t });
      await queryInterface.renameColumn('donation_item_adjustment_requests', 'quantity', 'amount', { transaction: t });
      await queryInterface.removeColumn('donation_item_adjustment_requests', 'value', { transaction: t });
      
      // Cleanup Enum type if necessary (dialect dependent)
    });
  }
};
