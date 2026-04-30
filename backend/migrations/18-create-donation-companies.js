'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_companies', {
      company_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      type: { type: Sequelize.ENUM('main','sister','partner'), defaultValue: 'main' },
      contact_info: { type: Sequelize.JSONB, defaultValue: {} },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },  // paranoid
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('donation_companies'); }
};