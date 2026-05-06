'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_deductions', 'from_beneficiary_id', {
      type: Sequelize.INTEGER,
      references: { model: 'beneficiaries', key: 'beneficiary_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
    await queryInterface.addColumn('donation_deductions', 'distribution_id', {
      type: Sequelize.INTEGER,
      references: { model: 'donation_distributions', key: 'distribution_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('donation_deductions', 'from_beneficiary_id');
    await queryInterface.removeColumn('donation_deductions', 'distribution_id');
  }
};
