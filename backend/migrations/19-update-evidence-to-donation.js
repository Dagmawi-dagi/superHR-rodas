'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Add donation_id to donation_distribution_evidences
      await queryInterface.addColumn('donation_distribution_evidences', 'donation_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'donations',
          key: 'donation_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction: t });

      // 2. Try to migrate existing data (optional but good)
      // We join with donation_items to get the donation_id
      await queryInterface.sequelize.query(`
        UPDATE donation_distribution_evidences e
        SET donation_id = i.donation_id
        FROM donation_items i
        WHERE e.donation_item_id = i.donation_item_id
      `, { transaction: t });

      // 3. Remove donation_item_id
      await queryInterface.removeColumn('donation_distribution_evidences', 'donation_item_id', { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Add donation_item_id back
      await queryInterface.addColumn('donation_distribution_evidences', 'donation_item_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'donation_items',
          key: 'donation_item_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction: t });

      // 2. Rollback data (optional)
      // This is harder because one donation has multiple items. 
      // We'll just pick the first item of that donation as a fallback.
      await queryInterface.sequelize.query(`
        UPDATE donation_distribution_evidences e
        SET donation_item_id = (
          SELECT donation_item_id 
          FROM donation_items i 
          WHERE i.donation_id = e.donation_id 
          LIMIT 1
        )
      `, { transaction: t });

      // 3. Remove donation_id
      await queryInterface.removeColumn('donation_distribution_evidences', 'donation_id', { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
