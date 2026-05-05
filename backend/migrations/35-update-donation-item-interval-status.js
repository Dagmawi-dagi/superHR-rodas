'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Drop the default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status DROP DEFAULT;
    `);

    // 2. Temporarily change the column type to text
    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status TYPE TEXT;
    `);

    // 3. Drop the old ENUM type
    // In Sequelize/Postgres, the type name is typically "enum_donation_item_intervals_status"
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_donation_item_intervals_status";
    `);

    // 4. Create the new ENUM type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_donation_item_intervals_status" AS ENUM('pending', 'distributed');
    `);

    // 5. Update any existing 'active' or 'completed' values to 'distributed' or 'pending' if necessary
    // For now, let's map 'active' and 'completed' to 'distributed' if they exist
    await queryInterface.sequelize.query(`
      UPDATE donation_item_intervals 
      SET status = 'distributed' 
      WHERE status IN ('active', 'completed');
    `);
    
    // Ensure all other values are 'pending' or 'distributed'
    await queryInterface.sequelize.query(`
      UPDATE donation_item_intervals 
      SET status = 'pending' 
      WHERE status NOT IN ('pending', 'distributed');
    `);

    // 6. Change the column type back to the new ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status TYPE "enum_donation_item_intervals_status" 
      USING (status::"enum_donation_item_intervals_status");
    `);

    // 7. Set the new default value
    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert logic
    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status TYPE TEXT;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_donation_item_intervals_status";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_donation_item_intervals_status" AS ENUM('pending', 'active', 'completed');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status TYPE "enum_donation_item_intervals_status" 
      USING (status::"enum_donation_item_intervals_status");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE donation_item_intervals 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);
  }
};
