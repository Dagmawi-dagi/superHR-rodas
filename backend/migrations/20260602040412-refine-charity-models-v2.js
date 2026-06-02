'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Refine charity_settings
      await queryInterface.removeColumn('charity_settings', 'companies', { transaction: t });
      await queryInterface.removeColumn('charity_settings', 'config', { transaction: t });

      // 2. Refine charity_teams
      await queryInterface.renameColumn('charity_teams', 'head_employee_id', 'head', { transaction: t });
      await queryInterface.renameColumn('charity_teams', 'vice_employee_id', 'vice', { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameColumn('charity_teams', 'vice', 'vice_employee_id', { transaction: t });
      await queryInterface.renameColumn('charity_teams', 'head', 'head_employee_id', { transaction: t });

      await queryInterface.addColumn('charity_settings', 'config', {
        type: Sequelize.JSONB,
        defaultValue: {}
      }, { transaction: t });
      await queryInterface.addColumn('charity_settings', 'companies', {
        type: Sequelize.JSONB,
        defaultValue: []
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
