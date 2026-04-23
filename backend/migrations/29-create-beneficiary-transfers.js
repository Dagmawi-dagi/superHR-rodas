'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beneficiary_transfers', {
      transfer_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      from_group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      to_group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      reason: { type: Sequelize.TEXT, allowNull: false },
      transferred_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('beneficiary_transfers'); }
