'use strict';

/**
 * Migration 19 — Add on_adjustment column to charity_donation_item
 * 
 * This column was missing in some early runs of Migration 18.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists first to avoid "already exists" errors if they re-ran 18
    const tableInfo = await queryInterface.describeTable('charity_donation_item');
    if (!tableInfo.on_adjustment) {
      await queryInterface.addColumn('charity_donation_item', 'on_adjustment', {
        type: Sequelize.JSONB,
        defaultValue: null,
        after: 'bank_receipts' // Visual placement in DB managers
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('charity_donation_item', 'on_adjustment');
  }
};
