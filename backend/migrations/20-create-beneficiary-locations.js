'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beneficiary_locations', {
      location_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      region: Sequelize.STRING(100),
      city: Sequelize.STRING(100),
      woreda: Sequelize.STRING(100),
      description: Sequelize.STRING(255),
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('beneficiary_locations'); }
};