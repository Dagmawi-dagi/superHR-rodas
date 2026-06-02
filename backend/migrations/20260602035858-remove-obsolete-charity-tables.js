'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('charity_request_approve', { transaction: t });
      await queryInterface.dropTable('charity_donation_item', { transaction: t });
      await queryInterface.dropTable('charity_donation', { transaction: t });

      // Clean up enums if they exist and are no longer used
      const enums = [
        'enum_charity_donation_item_type',
        'enum_charity_donation_item_payment_method',
        'enum_charity_request_approve_action',
        'enum_charity_request_approve_status'
      ];
      for (const e of enums) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e}" CASCADE;`, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a destructive migration, recovery would require re-running the setup migration
    // but for simplicity we can just throw or leave it empty if we don't expect to rollback.
  }
};
