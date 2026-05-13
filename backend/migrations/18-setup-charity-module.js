'use strict';

/**
 * Migration 18 — Charity Module v3 (consolidated)
 *
 * Roles: charity_admin | charity_teamleader
 *
 * Changes from previous version:
 *  - beneficiary_groups: + head_employee_id, vice_head_employee_id, members (JSONB)
 *  - donations:          + group_id (which group created this donation)
 *  - donation_items:     + beneficiary_id (item is per-beneficiary), distribution_date, payment_date
 *  - NEW table: donation_item_adjustment_requests
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {

      // 1. Donation Companies
      await queryInterface.createTable('donation_companies', {
        company_id:   { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name:         { type: Sequelize.STRING(150), allowNull: false },
        type:         { type: Sequelize.ENUM('main', 'sister', 'partner'), defaultValue: 'main' },
        contact_info: { type: Sequelize.JSONB, defaultValue: {} },
        is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
        created_by:   { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:   { type: Sequelize.DATE, allowNull: false },
        updated_at:   { type: Sequelize.DATE, allowNull: false },
        deleted_at:   { type: Sequelize.DATE },
      }, { transaction: t });

      // 2. Campaigns
      await queryInterface.createTable('campaigns', {
        campaign_id:        { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        title:              { type: Sequelize.STRING(200), allowNull: false },
        description:        Sequelize.TEXT,
        category:           Sequelize.STRING(100),
        start_date:         Sequelize.DATEONLY,
        end_date:           Sequelize.DATEONLY,
        target_amount:      { type: Sequelize.DECIMAL(15, 2) },
        status:             { type: Sequelize.ENUM('inactive', 'active', 'completed', 'cancelled'), defaultValue: 'inactive' },
        created_by:         { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        actual_end_date:    Sequelize.DATEONLY,
        termination_reason: Sequelize.TEXT,
        extension_reason:   Sequelize.TEXT,
        created_at:         { type: Sequelize.DATE, allowNull: false },
        updated_at:         { type: Sequelize.DATE, allowNull: false },
        deleted_at:         { type: Sequelize.DATE },
      }, { transaction: t });

      // 3. Beneficiary Locations
      await queryInterface.createTable('beneficiary_locations', {
        location_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        region:      Sequelize.STRING(100),
        city:        Sequelize.STRING(100),
        woreda:      Sequelize.STRING(100),
        description: Sequelize.STRING(255),
      }, { transaction: t });

      // 4. Beneficiary Groups (v3: head, vice, members)
      await queryInterface.createTable('beneficiary_groups', {
        group_id:              { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name:                  { type: Sequelize.STRING(150), allowNull: false },
        description:           Sequelize.TEXT,
        // v3 NEW ──────────────────────────────────────────────────────────────
        head_employee_id:      { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        vice_head_employee_id: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        members:               { type: Sequelize.JSONB, defaultValue: [] },
        // legacy (kept)
        manager_employee_id:   { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        is_active:             { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at:            { type: Sequelize.DATE, allowNull: false },
        updated_at:            { type: Sequelize.DATE, allowNull: false },
        deleted_at:            { type: Sequelize.DATE },
      }, { transaction: t });

      // 5. Beneficiaries
      await queryInterface.createTable('beneficiaries', {
        beneficiary_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        type:           { type: Sequelize.ENUM('individual', 'organization'), allowNull: false },
        name:           Sequelize.STRING(200),
        contact_info:   { type: Sequelize.JSONB, defaultValue: {} },
        location_id:    { type: Sequelize.INTEGER, references: { model: 'beneficiary_locations', key: 'location_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        group_id:       { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_by:     { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:     { type: Sequelize.DATE, allowNull: false },
        updated_at:     { type: Sequelize.DATE, allowNull: false },
        deleted_at:     { type: Sequelize.DATE },
      }, { transaction: t });

      // 6. Beneficiary Transfers
      await queryInterface.createTable('beneficiary_transfers', {
        transfer_id:    { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        from_group_id:  { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        to_group_id:    { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        reason:         { type: Sequelize.TEXT, allowNull: false },
        transferred_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:     { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 7. Donations (v3: + group_id)
      await queryInterface.createTable('donations', {
        donation_id:    { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        company_id:     { type: Sequelize.INTEGER, references: { model: 'donation_companies', key: 'company_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        campaign_id:    { type: Sequelize.INTEGER, references: { model: 'campaigns', key: 'campaign_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        group_id:       { type: Sequelize.INTEGER, references: { model: 'beneficiary_groups', key: 'group_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        donation_date:  Sequelize.DATEONLY,
        total_value:    { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        status:         { type: Sequelize.ENUM('draft', 'pending', 'approved', 'distributed', 'cancelled'), defaultValue: 'draft' },
        notes:          Sequelize.TEXT,
        created_by:     { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        approved_by:    { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        distributed_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:     { type: Sequelize.DATE, allowNull: false },
        updated_at:     { type: Sequelize.DATE, allowNull: false },
        deleted_at:     { type: Sequelize.DATE },
      }, { transaction: t });

      // 8. Donation Items (v3: + beneficiary_id, distribution_date, payment_date)
      await queryInterface.createTable('donation_items', {
        donation_item_id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id:          { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        // v3 NEW ──────────────────────────────────────────────────────────────
        beneficiary_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        distribution_date:    Sequelize.DATEONLY,  // scheduled — editable by charity_admin
        payment_date:         Sequelize.DATEONLY,  // actual    — set on distribution
        // existing ─────────────────────────────────────────────────────────────
        type:                 { type: Sequelize.ENUM('money', 'goods', 'service'), allowNull: false },
        description:          Sequelize.STRING(255),
        quantity:             { type: Sequelize.DECIMAL(10, 2) },
        unit_value:           { type: Sequelize.DECIMAL(15, 2) },
        total_value:          { type: Sequelize.DECIMAL(15, 2) },
        payment_method:       { type: Sequelize.ENUM('bank', 'cash'), defaultValue: 'bank' },
        unassigned_deduction: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        is_recurring:         { type: Sequelize.BOOLEAN, defaultValue: false },
        status:               { type: Sequelize.ENUM('pending', 'distributed'), defaultValue: 'pending' },
        created_at:           { type: Sequelize.DATE, allowNull: false },
        updated_at:           { type: Sequelize.DATE, allowNull: false },
        deleted_at:           { type: Sequelize.DATE },
      }, { transaction: t });

      // 9. Donation Item Intervals
      await queryInterface.createTable('donation_item_intervals', {
        interval_id:      { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        interval_type:    { type: Sequelize.ENUM('daily', 'weekly', 'monthly'), allowNull: false },
        interval_count:   { type: Sequelize.INTEGER, allowNull: false },
        start_date:       { type: Sequelize.DATEONLY, allowNull: false },
        end_date:         { type: Sequelize.DATEONLY, allowNull: false },
        status:           { type: Sequelize.ENUM('pending', 'active', 'distributed', 'completed'), defaultValue: 'pending' },
        created_at:       { type: Sequelize.DATE, allowNull: false },
        updated_at:       { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 10. Donation Distributions
      await queryInterface.createTable('donation_distributions', {
        distribution_id:  { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        beneficiary_id:   { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        interval_id:      { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        quantity:         { type: Sequelize.DECIMAL(10, 2) },
        value:            { type: Sequelize.DECIMAL(15, 2) },
        is_returned:      { type: Sequelize.BOOLEAN, defaultValue: false },
        return_reason:    Sequelize.TEXT,
        returned_at:      Sequelize.DATE,
        created_at:       { type: Sequelize.DATE, allowNull: false },
        updated_at:       { type: Sequelize.DATE, allowNull: false },
        deleted_at:       { type: Sequelize.DATE },
      }, { transaction: t });

      // 11. Donation Distribution Evidences
      await queryInterface.createTable('donation_distribution_evidences', {
        evidence_id:      { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id: { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        interval_id:      { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        file_url:         { type: Sequelize.STRING(255), allowNull: false },
        file_name:        Sequelize.STRING(255),
        file_type:        Sequelize.STRING(50),
        uploaded_by:      { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:       { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 12. Donation Approvals
      await queryInterface.createTable('donation_approvals', {
        approval_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        approved_by: { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        status:      { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        comment:     Sequelize.TEXT,
        created_at:  { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 13. Donation Logs
      await queryInterface.createTable('donation_logs', {
        log_id:      { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id: { type: Sequelize.INTEGER, references: { model: 'donations', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        user_id:     { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        action:      Sequelize.STRING(100),
        metadata:    { type: Sequelize.JSONB, defaultValue: {} },
        created_at:  { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 14. Donation Deductions
      await queryInterface.createTable('donation_deductions', {
        deduction_id:                 { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id:             { type: Sequelize.INTEGER, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        distribution_id:              { type: Sequelize.INTEGER, references: { model: 'donation_distributions', key: 'distribution_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        interval_id:                  { type: Sequelize.INTEGER, references: { model: 'donation_item_intervals', key: 'interval_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        amount:                       { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        reason:                       { type: Sequelize.TEXT, allowNull: false },
        from_beneficiary_id:          { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        reassigned_to_beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        deduction_date:               { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
        created_by:                   { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:                   { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      // 15. Donation Item Adjustment Requests (NEW)
      await queryInterface.createTable('donation_item_adjustment_requests', {
        adjustment_id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_item_id:  { type: Sequelize.INTEGER, allowNull: false, references: { model: 'donation_items', key: 'donation_item_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        beneficiary_id:    { type: Sequelize.INTEGER, allowNull: false, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        type:              { type: Sequelize.ENUM('deduct', 'increase', 'reassign', 'return'), allowNull: false },
        amount:            { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        reason:            { type: Sequelize.TEXT, allowNull: false },
        to_beneficiary_id: { type: Sequelize.INTEGER, references: { model: 'beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        status:            { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        requested_by:      { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        reviewed_by:       { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        admin_comment:     Sequelize.TEXT,
        created_at:        { type: Sequelize.DATE, allowNull: false },
        updated_at:        { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const drops = [
        'donation_item_adjustment_requests',
        'donation_deductions',
        'donation_logs',
        'donation_approvals',
        'donation_distribution_evidences',
        'donation_distributions',
        'donation_item_intervals',
        'donation_items',
        'donations',
        'beneficiary_transfers',
        'beneficiaries',
        'beneficiary_groups',
        'beneficiary_locations',
        'campaigns',
        'donation_companies',
      ];
      for (const tbl of drops) await queryInterface.dropTable(tbl, { transaction: t });

      const enums = [
        'enum_donation_companies_type',
        'enum_campaigns_status',
        'enum_beneficiaries_type',
        'enum_donations_status',
        'enum_donation_items_type',
        'enum_donation_items_payment_method',
        'enum_donation_items_status',
        'enum_donation_item_intervals_interval_type',
        'enum_donation_item_intervals_status',
        'enum_donation_approvals_status',
        'enum_donation_item_adjustment_requests_type',
        'enum_donation_item_adjustment_requests_status',
      ];
      for (const e of enums) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e}";`, { transaction: t });
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};