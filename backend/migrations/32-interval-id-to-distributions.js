'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_distributions', 'interval_id', {
      type: Sequelize.INTEGER,
      references: { model: 'donation_item_intervals', key: 'interval_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('donation_distributions', 'interval_id');
  },
};