'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_distributions', 'is_returned', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('donation_distributions', 'return_reason', { type: Sequelize.TEXT });
    await queryInterface.addColumn('donation_distributions', 'returned_at', { type: Sequelize.DATE });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('donation_distributions', 'is_returned');
    await queryInterface.removeColumn('donation_distributions', 'return_reason');
    await queryInterface.removeColumn('donation_distributions', 'returned_at');
  }
};