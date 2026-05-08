'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Donation Companies
      await queryInterface.createTable('donation_companies', {
        company_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(150), allowNull: false },
        type: { type: Sequelize.ENUM('main', 'sister', 'partner'), defaultValue: 'main' },
        contact_info: { type: Sequelize.JSONB, defaultValue: {} },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 2. Campaigns
      await queryInterface.createTable('campaigns', {
        campaign_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: Sequelize.STRING(200), allowNull: false },
        description: Sequelize.TEXT,
        category: Sequelize.STRING(100),
        start_date: Sequelize.DATEONLY,
        end_date: Sequelize.DATEONLY,
        target_amount: Sequelize.DECIMAL(15, 2),
        status: { type: Sequelize.ENUM('planned', 'active', 'completed', 'cancelled'), defaultValue: 'planned' },
        created_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        actual_end_date: Sequelize.DATEONLY,
        termination_reason: Sequelize.TEXT,
        extension_reason: Sequelize.TEXT,
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 3. Beneficiary Locations
      await queryInterface.createTable('beneficiary_locations', {
        location_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        region: Sequelize.STRING(100),
        city: Sequelize.STRING(100),
        woreda: Sequelize.STRING(100),
        description: Sequelize.STRING(255),
      }, { transaction });

      // 4. Beneficiary Groups
      await queryInterface.createTable('beneficiary_groups', {
        group_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(150), allowNull: false },
        description: Sequelize.TEXT,
        manager_employee_id: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 5. Beneficiaries
      await queryInterface.createTable('beneficiaries', {
        beneficiary_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        type: { type: Sequelize.ENUM('individual', 'organization'), allowNull: false },
        name: Sequelize.STRING(200),
        contact_info: { type: Sequelize.JSONB, defaultValue: {} },
        location_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_locations', key: 'location_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 6. Beneficiary Transfers
      await queryInterface.createTable('beneficiary_transfers', {
        transfer_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        from_group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        to_group_id: { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        reason: { type: Sequelize.TEXT, allowNull: false },
        transferred_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // 7. Donations
      await queryInterface.createTable('donations', {
        donation_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        company_id: { type: Sequelize.INTEGER, references: { model: 'donation_companies', key: 'company_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        campaign_id: { type: Sequelize.INTEGER, references: { model: 'campaigns', key: 'campaign_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        donation_date: Sequelize.DATEONLY,
        total_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        status: { type: Sequelize.ENUM('draft', 'pending', 'approved', 'distributed', 'cancelled'), defaultValue: 'draft' },
        notes: Sequelize.TEXT,
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 8. Donation Items
      await queryInterface.createTable('donation_items', {
        donation_item_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        type: { type: Sequelize.ENUM('money', 'goods', 'service'), allowNull: false },
        description: Sequelize.STRING(255),
        quantity: Sequelize.DECIMAL(10, 2),
        unit_value: Sequelize.DECIMAL(15, 2),
        total_value: Sequelize.DECIMAL(15, 2),
        payment_method: { type: Sequelize.ENUM('bank', 'cash'), defaultValue: 'bank' },
        unassigned_deduction: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        is_recurring: { type: Sequelize.BOOLEAN, defaultValue: false },
        status: { type: Sequelize.ENUM('pending', 'distributed'), defaultValue: 'pending' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 9. Donation Item Intervals
      await queryInterface.createTable('donation_item_intervals', {
        interval_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        interval_type: { type: Sequelize.ENUM('daily', 'weekly', 'monthly'), allowNull: false },
        interval_count: { type: Sequelize.INTEGER, allowNull: false },
        start_date: { type: Sequelize.DATEONLY, allowNull: false },
        end_date: { type: Sequelize.DATEONLY, allowNull: false },
        status: { type: Sequelize.ENUM('pending', 'active', 'distributed', 'completed'), defaultValue: 'pending' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // 10. Donation Distributions
      await queryInterface.createTable('donation_distributions', {
        distribution_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        interval_id: { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        quantity: Sequelize.DECIMAL(10, 2),
        value: Sequelize.DECIMAL(15, 2),
        is_returned: { type: Sequelize.BOOLEAN, defaultValue: false },
        return_reason: Sequelize.TEXT,
        returned_at: Sequelize.DATE,
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction });

      // 11. Donation Distribution Evidences
      await queryInterface.createTable('donation_distribution_evidences', {
        evidence_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        interval_id: { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        file_url: { type: Sequelize.STRING(255), allowNull: false },
        file_name: Sequelize.STRING(255),
        file_type: Sequelize.STRING(50),
        uploaded_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // 12. Donation Approvals
      await queryInterface.createTable('donation_approvals', {
        approval_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        approved_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        comment: Sequelize.TEXT,
        created_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // 13. Donation Logs
      await queryInterface.createTable('donation_logs', {
        log_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        user_id: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        action: Sequelize.STRING(100),
        metadata: { type: Sequelize.JSONB, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // 14. Donation Deductions
      await queryInterface.createTable('donation_deductions', {
        deduction_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        distribution_id: { type: Sequelize.INTEGER, references: { model: 'donation_distributions', key: 'distribution_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        interval_id: { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        reason: { type: Sequelize.TEXT, allowNull: false },
        from_beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        reassigned_to_beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        deduction_date: { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
        created_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('donation_deductions', { transaction });
      await queryInterface.dropTable('donation_logs', { transaction });
      await queryInterface.dropTable('donation_approvals', { transaction });
      await queryInterface.dropTable('donation_distribution_evidences', { transaction });
      await queryInterface.dropTable('donation_distributions', { transaction });
      await queryInterface.dropTable('donation_item_intervals', { transaction });
      await queryInterface.dropTable('donation_items', { transaction });
      await queryInterface.dropTable('donations', { transaction });
      await queryInterface.dropTable('beneficiary_transfers', { transaction });
      await queryInterface.dropTable('beneficiaries', { transaction });
      await queryInterface.dropTable('beneficiary_groups', { transaction });
      await queryInterface.dropTable('beneficiary_locations', { transaction });
      await queryInterface.dropTable('campaigns', { transaction });
      await queryInterface.dropTable('donation_companies', { transaction });
      
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_companies_type";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaigns_status";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_beneficiaries_type";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donations_status";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_items_type";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_items_payment_method";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_items_status";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_item_intervals_interval_type";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_item_intervals_status";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_donation_approvals_status";', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
