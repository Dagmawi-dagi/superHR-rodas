'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_logs', {
      log_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      action: Sequelize.STRING(100),
      metadata: { type: Sequelize.JSONB, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('donation_logs'); }
};