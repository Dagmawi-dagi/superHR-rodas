'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_items', {
      donation_item_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('money','goods','service'), allowNull: false },
      description: Sequelize.STRING(255),
      quantity: Sequelize.DECIMAL(10,2),
      unit_value: Sequelize.DECIMAL(15,2),
      total_value: Sequelize.DECIMAL(15,2),
      payment_method: { type: Sequelize.ENUM('bank','cash'), defaultValue: 'bank' },
      unassigned_deduction: { type: Sequelize.DECIMAL(15,2), defaultValue: 0 },
      status: { type: Sequelize.ENUM('pending','distributed'), defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('donation_items'); }
};