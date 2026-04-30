'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_approvals', {
      approval_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      approved_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('pending','approved','rejected'), defaultValue: 'pending' },
      comment: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('donation_approvals'); }
};