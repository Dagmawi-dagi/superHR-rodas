'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_deductions', {
      deduction_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      amount: { type: Sequelize.DECIMAL(15,2), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      reassigned_to_beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      deduction_date: { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
      created_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('donation_deductions'); }
};