'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_deductions', 'interval_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'donation_item_intervals',
        key: 'interval_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
      after: 'distribution_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('donation_deductions', 'interval_id');
  }
};
