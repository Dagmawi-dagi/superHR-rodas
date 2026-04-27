'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donation_distribution_evidences', {
      evidence_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      distribution_id: {
        type: Sequelize.INTEGER,
        references: { model: 'donation_distributions', key: 'distribution_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_url: { type: Sequelize.STRING(255), allowNull: false },
      file_name: { type: Sequelize.STRING(255) },
      file_type: { type: Sequelize.STRING(50) },
      uploaded_by: {
        type: Sequelize.INTEGER,
        references: { model: 'employees', key: 'employee_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('donation_distribution_evidences');
  },
};