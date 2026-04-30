'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beneficiary_groups', {
      group_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: Sequelize.TEXT,
      manager_employee_id: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('beneficiary_groups'); }
};