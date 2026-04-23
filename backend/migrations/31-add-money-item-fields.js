'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_items', 'payment_method', {
      type: Sequelize.ENUM('bank', 'cash'),
      defaultValue: 'bank'
    });
    await queryInterface.addColumn('donation_items', 'unassigned_deduction', {
      type: Sequelize.DECIMAL(15,2),
      defaultValue: 0
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('donation_items', 'payment_method');
    await queryInterface.removeColumn('donation_items', 'unassigned_deduction');
    // Drop enum type if needed
  }
