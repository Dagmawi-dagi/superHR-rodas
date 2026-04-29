'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_items', 'status', {
      type: Sequelize.ENUM('pending', 'distributed'),
      defaultValue: 'pending'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('donation_items', 'status');
  }
};