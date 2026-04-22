'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('campaigns', 'actual_end_date', { type: Sequelize.DATEONLY });
    await queryInterface.addColumn('campaigns', 'termination_reason', { type: Sequelize.TEXT });
    await queryInterface.addColumn('campaigns', 'extension_reason', { type: Sequelize.TEXT });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('campaigns', 'actual_end_date');
    await queryInterface.removeColumn('campaigns', 'termination_reason');
    await queryInterface.removeColumn('campaigns', 'extension_reason');
  }
};