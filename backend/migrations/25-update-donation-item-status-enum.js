'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Update donation_items status enum
      // In Postgres, adding a value to an existing ENUM is straightforward
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_donation_items_status" ADD VALUE IF NOT EXISTS 'returned';
      `, { transaction: t });

      // 2. Update donation_item_intervals status enum
      // We need to drop the default before changing the type to avoid casting errors
      
      // Drop default constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE "donation_item_intervals" ALTER COLUMN "status" DROP DEFAULT;
      `, { transaction: t });

      // Rename old type
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_donation_item_intervals_status" RENAME TO "enum_donation_item_intervals_status_old";
      `, { transaction: t });

      // Create new type
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_donation_item_intervals_status" AS ENUM('pending', 'returned', 'distributed');
      `, { transaction: t });

      // Update column to use new type (with casting)
      await queryInterface.sequelize.query(`
        ALTER TABLE "donation_item_intervals" 
        ALTER COLUMN "status" TYPE "enum_donation_item_intervals_status" 
        USING (
          CASE 
            WHEN "status"::text = 'active' THEN 'pending'::"enum_donation_item_intervals_status"
            WHEN "status"::text = 'completed' THEN 'distributed'::"enum_donation_item_intervals_status"
            ELSE "status"::text::"enum_donation_item_intervals_status"
          END
        );
      `, { transaction: t });

      // Re-apply default constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE "donation_item_intervals" ALTER COLUMN "status" SET DEFAULT 'pending'::"enum_donation_item_intervals_status";
      `, { transaction: t });

      // Drop old type
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_donation_item_intervals_status_old";
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback logic omitted for brevity as this is a schema standardization
  }
};
