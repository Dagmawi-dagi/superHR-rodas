'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaigns', {
      campaign_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: Sequelize.TEXT,
      category: Sequelize.STRING(100),
      start_date: Sequelize.DATEONLY,
      end_date: Sequelize.DATEONLY,
      target_amount: Sequelize.DECIMAL(15,2),
      status: { type: Sequelize.ENUM('planned','active','completed','cancelled'), defaultValue: 'planned' },
      created_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      actual_end_date: Sequelize.DATEONLY,
      termination_reason: Sequelize.TEXT,
      extension_reason: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('campaigns'); }
};