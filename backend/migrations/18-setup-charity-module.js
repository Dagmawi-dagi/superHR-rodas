'use strict';

/**
 * Migration 18 — Charity Module (complete, single migration)
 *
 * 6 tables:
 *   charity_teams              → teams (head / vice / members JSON array)
 *   charity_beneficiaries      → beneficiaries (full_info JSON)
 *   charity_donation           → donation header (batch info)
 *   charity_donation_item      → individual line items (one-time or recurring)
 *   charity_request_approve    → approval-workflow table for all charity actions
 *   charity_settings           → system config for charity
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {

      // ── 1. Charity Teams ───────────────────────────────────────────────────
      await queryInterface.createTable('charity_teams', {
        team_id:            { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name:               { type: Sequelize.STRING(150), allowNull: false },
        description:        { type: Sequelize.TEXT },
        head_employee_id:   { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        vice_employee_id:   { type: Sequelize.INTEGER, references: { model: 'employees', key: 'employee_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        members:            { type: Sequelize.JSONB, defaultValue: [] },
        is_active:          { type: Sequelize.BOOLEAN, defaultValue: true },
        created_by:         { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:         { type: Sequelize.DATE, allowNull: false },
        updated_at:         { type: Sequelize.DATE, allowNull: false },
        deleted_at:         { type: Sequelize.DATE },
      }, { transaction: t });

      // ── 2. Charity Beneficiaries ───────────────────────────────────────────
      await queryInterface.createTable('charity_beneficiaries', {
        beneficiary_id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name:               { type: Sequelize.STRING(200), allowNull: false },
        type:               { type: Sequelize.ENUM('individual', 'organization'), allowNull: false },
        full_info:          { type: Sequelize.JSONB, defaultValue: {} },
        team_id:            { type: Sequelize.INTEGER, references: { model: 'charity_teams', key: 'team_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        is_active:          { type: Sequelize.BOOLEAN, defaultValue: true },
        created_by:         { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:         { type: Sequelize.DATE, allowNull: false },
        updated_at:         { type: Sequelize.DATE, allowNull: false },
        deleted_at:         { type: Sequelize.DATE },
      }, { transaction: t });

      // ── 3. Charity Donation ────────────────────────────────────────────────
      await queryInterface.createTable('charity_donation', {
        donation_id:                { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        team_id:                    { type: Sequelize.INTEGER, references: { model: 'charity_teams', key: 'team_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        total_value_in_birr:        { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        description:                { type: Sequelize.TEXT },
        donation_delivery_date:     { type: Sequelize.DATEONLY },
        created_by:                 { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:                 { type: Sequelize.DATE, allowNull: false },
        updated_at:                 { type: Sequelize.DATE, allowNull: false },
        deleted_at:                 { type: Sequelize.DATE },
      }, { transaction: t });

      // ── 4. Charity Donation Item ────────────────────────────────────────────
      await queryInterface.createTable('charity_donation_item', {
        donation_item_id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        donation_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: 'charity_donation', key: 'donation_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        beneficiary_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: 'charity_beneficiaries', key: 'beneficiary_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        type:                 { type: Sequelize.ENUM('money', 'goods', 'service'), allowNull: false },
        description:          { type: Sequelize.STRING(255) },
        quantity:             { type: Sequelize.DECIMAL(10, 2) },
        unit_value_in_birr:   { type: Sequelize.DECIMAL(15, 2) },
        total_value_in_birr:  { type: Sequelize.DECIMAL(15, 2) },
        payment_method:       { type: Sequelize.ENUM('bank', 'cash'), defaultValue: 'bank' },
        is_recurring:         { type: Sequelize.JSONB, defaultValue: null },
        is_returned:          { type: Sequelize.JSONB, defaultValue: null },
        is_delivered:         { type: Sequelize.BOOLEAN, defaultValue: false },
        bank_receipts:        { type: Sequelize.JSONB, defaultValue: [] },
        on_adjustment:        { type: Sequelize.JSONB, defaultValue: null },
        created_by:           { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:           { type: Sequelize.DATE, allowNull: false },
        updated_at:           { type: Sequelize.DATE, allowNull: false },
        deleted_at:           { type: Sequelize.DATE },
      }, { transaction: t });

      // ── 5. Charity Request Approve ──────────────────────────────────────────
      await queryInterface.createTable('charity_request_approve', {
        request_id:   { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        user_id:      { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        action: {
          type: Sequelize.ENUM(
            'NewBeneficiary',
            'NewCharityTeam',
            'NewDonation',
            'TransferBeneficiary',
            'Deduct',
            'Increase',
            'Transfer',
            'Return',
            'Reassign'
          ),
          allowNull: false,
        },
        requested_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        status:       { type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'commented'), defaultValue: 'pending' },
        approved_by:  { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        rejected_by:  { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        reviewed_at:  { type: Sequelize.DATE },
        comments:     { type: Sequelize.JSONB, defaultValue: [] },
        metadata:     { type: Sequelize.JSONB, defaultValue: {} },
        created_at:   { type: Sequelize.DATE, allowNull: false },
        updated_at:   { type: Sequelize.DATE, allowNull: false },
        deleted_at:   { type: Sequelize.DATE },
      }, { transaction: t });

      // ── 6. Charity Settings ────────────────────────────────────────────────
      await queryInterface.createTable('charity_settings', {
        setting_id:   { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        setting_key:  { type: Sequelize.STRING(50), allowNull: false, unique: true },
        companies:    { type: Sequelize.JSONB, defaultValue: [] },
        config:       { type: Sequelize.JSONB, defaultValue: {} },
        updated_by:   { type: Sequelize.INTEGER, references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at:   { type: Sequelize.DATE, allowNull: false },
        updated_at:   { type: Sequelize.DATE, allowNull: false },
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
      await queryInterface.dropTable('charity_settings', { transaction: t });
      await queryInterface.dropTable('charity_request_approve', { transaction: t });
      await queryInterface.dropTable('charity_donation_item', { transaction: t });
      await queryInterface.dropTable('charity_donation', { transaction: t });
      await queryInterface.dropTable('charity_beneficiaries', { transaction: t });
      await queryInterface.dropTable('charity_teams', { transaction: t });

      const enums = [
        'enum_charity_beneficiaries_type',
        'enum_charity_donation_item_type',
        'enum_charity_donation_item_payment_method',
        'enum_charity_request_approve_action',
        'enum_charity_request_approve_status',
      ];
      for (const e of enums) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e}";`, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
