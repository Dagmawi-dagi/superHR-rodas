'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // drop old FK and column
    await queryInterface.removeColumn('donation_distribution_evidences', 'distribution_id');
    // add new column
    await queryInterface.addColumn('donation_distribution_evidences', 'donation_item_id', {
      type: Sequelize.INTEGER,
      references: { model: 'donation_items', key: 'donation_item_id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('donation_distribution_evidences', 'donation_item_id');
    await queryInterface.addColumn('donation_distribution_evidences', 'distribution_id', {
      type: Sequelize.INTEGER,
      references: { model: 'donation_distributions', key: 'distribution_id' }
    });
  }
};