'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beneficiaries', {
      beneficiary_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.ENUM('individual','organization'), allowNull: false },
      name: Sequelize.STRING(200),
      contact_info: { type: Sequelize.JSONB, defaultValue: {} },
      location_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_locations', key: 'location_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('beneficiaries'); }
};