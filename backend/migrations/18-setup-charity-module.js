'use strict';

/**
 * Migration 18 — Charity Module (complete, single migration)
 *
 * 6 tables:
 *   charity_teams              → teams (head / vice / members JSON array)
 *   charity_beneficiaries      → beneficiaries (full_info JSON, team-scoped)
 *   charity_donation           → donation header (team-scoped, single delivery date)
 *   charity_donation_item      → per-beneficiary item (recurring embedded as JSON)
 *   charity_request_approve    → single approval-workflow table for ALL action types
 *   charity_settings           → global module settings (companies list, etc.)
 *
 * ─── FIELD NOTES ─────────────────────────────────────────────────────────────
 *
 *  charity_beneficiaries.name
 *    Top-level VARCHAR alongside full_info JSON — lets you filter/sort by name
 *    in SQL without JSON extraction (index-friendly for list views).
 *
 *  charity_donation.team_id
 *    References charity_teams. Your spec used group_id — renamed for consistency
 *    since you renamed groups → teams everywhere.
 *
 *  charity_donation_item.unit_value_in_birr
 *    Added at item level so quantity × unit = total is self-consistent for
 *    one-time items (recurrings already carry unit_value inside their intervals).
 *
 *  charity_donation_item.description
 *    Short label for the item — useful for 'goods' type ("Rice bags", etc.).
 *
 *  charity_request_approve.reviewed_at
 *    Explicit timestamp for when the admin approved/rejected/commented.
 *    updated_at is not reliable for this purpose.
 *
 *  charity_settings.setting_key
 *    Allows multiple setting types ('main', 'reporting', …) without a future
 *    schema change — just insert another row.
 *
 * ─── JSON SHAPES ─────────────────────────────────────────────────────────────
 *
 *  charity_donation_item.is_recurring  (null = one-time item)
 *  {
 *    "recurring_type":  "monthly" | "weekly" | "daily",
 *    "recurring_count": 3,
 *    "recurrings": [
 *      {
 *        "recurring_id":        1,        // 1-based ordinal (month 1, week 1, …)
 *        "quantity":            10.00,
 *        "unit_value_in_birr":  500.00,
 *        "total_value_in_birr": 5000.00,
 *        "payment_method":     "bank" | "cash",
 *        "is_delivered":        false,
 *        "is_returned":         null | { "reason": "…" }
 *      }
 *    ]
 *  }
 *
 *  charity_donation_item.is_returned   (null = not returned)
 *  { "reason": "beneficiary relocated" }
 *
 *  charity_donation_item.bank_receipts
 *  [ "https://storage/…/receipt1.pdf", "…" ]
 *
 *  charity_request_approve.comments
 *  [ { "user_id": 3, "text": "…", "created_at": "2026-05-19T…" } ]
 *
 *  charity_request_approve.metadata   (only relevant fields populated per action)
 *  {
 *    "beneficiary_id":        123,   // NewBeneficiary | TransferBeneficiary
 *    "charity_team_id":       5,     // NewCharityTeam
 *    "donation_item_id":      88,    // Deduct | Increase | Transfer | Return
 *    "recurring_interval_id": 2      // when action targets a specific interval
 *  }
 *
 *  charity_settings.companies
 *  [ { "name": "Ethio Telecom", "full_info": { "phone": "…", "email": "…" } } ]
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {

      // ── 1. CHARITY TEAMS ──────────────────────────────────────────────────────
      await queryInterface.createTable('charity_teams', {
        team_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
        },
        head_employee_id: {
          type: Sequelize.INTEGER,
          references: { model: 'employees', key: 'employee_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        vice_employee_id: {
          type: Sequelize.INTEGER,
          references: { model: 'employees', key: 'employee_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        // Array of employee_id numbers  e.g. [3, 7, 12]
        members: {
          type: Sequelize.JSONB,
          defaultValue: [],
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction: t });


      // ── 2. CHARITY BENEFICIARIES ──────────────────────────────────────────────
      await queryInterface.createTable('charity_beneficiaries', {
        beneficiary_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM('individual', 'organization'),
          allowNull: false,
        },
        // Future-proof info bag: { location: { region, city, woreda }, contact: {}, … }
        full_info: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        team_id: {
          type: Sequelize.INTEGER,
          references: { model: 'charity_teams', key: 'team_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction: t });


      // ── 3. CHARITY DONATION ───────────────────────────────────────────────────
      await queryInterface.createTable('charity_donation', {
        donation_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        team_id: {
          type: Sequelize.INTEGER,
          references: { model: 'charity_teams', key: 'team_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        // Maintained by app: sum of all donation_item.total_value_in_birr
        total_value_in_birr: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0,
        },
        status: {
          type: Sequelize.ENUM('draft', 'pending', 'approved', 'cancelled'),
          defaultValue: 'draft',
        },
        description: {
          type: Sequelize.TEXT,
        },
        // Global target delivery date for all items in this donation
        donation_delivery_date: {
          type: Sequelize.DATEONLY,
        },
        created_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction: t });


      // ── 4. CHARITY DONATION ITEM ──────────────────────────────────────────────
      // Recurring info lives entirely inside is_recurring JSONB.
      // Non-recurring items have is_recurring = null.
      await queryInterface.createTable('charity_donation_item', {
        donation_item_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        donation_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'charity_donation', key: 'donation_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        beneficiary_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'charity_beneficiaries', key: 'beneficiary_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        type: {
          type: Sequelize.ENUM('money', 'goods', 'service'),
          allowNull: false,
        },
        // Short label for the item e.g. "Rice bags", "School uniform"
        description: {
          type: Sequelize.STRING(255),
        },
        // Top-level (one-time) fields — not used when is_recurring is set
        quantity: {
          type: Sequelize.DECIMAL(10, 2),
        },
        unit_value_in_birr: {
          type: Sequelize.DECIMAL(15, 2),
        },
        total_value_in_birr: {
          type: Sequelize.DECIMAL(15, 2),
        },
        payment_method: {
          type: Sequelize.ENUM('bank', 'cash'),
          defaultValue: 'bank',
        },
        // null → one-time.  JSON object → recurring config + intervals array.
        is_recurring: {
          type: Sequelize.JSONB,
          defaultValue: null,
        },
        // null → not returned.  { reason: "…" } → returned.
        is_returned: {
          type: Sequelize.JSONB,
          defaultValue: null,
        },
        is_delivered: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        // Array of file-URL strings for bank transfer receipts / evidence
        bank_receipts: {
          type: Sequelize.JSONB,
          defaultValue: [],
        },
        created_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      }, { transaction: t });


      // ── 5. CHARITY REQUEST APPROVE ────────────────────────────────────────────
      // Every action that needs charity_admin approval flows through here.
      // user_id      = the admin this request is routed to (inbox / assignment)
      // requested_by = the team leader who submitted it
      await queryInterface.createTable('charity_request_approve', {
        request_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        // Admin this request is assigned/routed to
        user_id: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        action: {
          type: Sequelize.ENUM(
            'NewBeneficiary',
            'NewCharityTeam',
            'TransferBeneficiary',
            'Deduct',
            'Increase',
            'Transfer',
            'Return'
          ),
          allowNull: false,
        },
        requested_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        status: {
          type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'commented'),
          defaultValue: 'pending',
        },
        approved_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        rejected_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        // When the review action happened
        reviewed_at: {
          type: Sequelize.DATE,
        },
        // [ { user_id, text, created_at }, … ]
        comments: {
          type: Sequelize.JSONB,
          defaultValue: [],
        },
        // Context pointers — only relevant fields populated per action type:
        //   NewBeneficiary | TransferBeneficiary → beneficiary_id
        //   NewCharityTeam                        → charity_team_id
        //   Deduct | Increase | Transfer | Return → donation_item_id
        //                                           + recurring_interval_id (if recurring)
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });


      // ── 6. CHARITY SETTINGS ───────────────────────────────────────────────────
      await queryInterface.createTable('charity_settings', {
        setting_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        // Allows multiple setting rows without a schema change (e.g. 'reporting')
        setting_key: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          defaultValue: 'main',
        },
        // [ { name, full_info: { phone, email, address, … } } ]
        companies: {
          type: Sequelize.JSONB,
          defaultValue: [],
        },
        // Spare bucket for any future global config
        config: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        updated_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });


      // ── INDEXES ───────────────────────────────────────────────────────────────
      await queryInterface.addIndex('charity_beneficiaries',   ['team_id'],        { transaction: t });
      await queryInterface.addIndex('charity_beneficiaries',   ['is_active'],      { transaction: t });
      await queryInterface.addIndex('charity_donation',        ['team_id'],        { transaction: t });
      await queryInterface.addIndex('charity_donation',        ['status'],         { transaction: t });
      await queryInterface.addIndex('charity_donation_item',   ['donation_id'],    { transaction: t });
      await queryInterface.addIndex('charity_donation_item',   ['beneficiary_id'], { transaction: t });
      await queryInterface.addIndex('charity_request_approve', ['status'],         { transaction: t });
      await queryInterface.addIndex('charity_request_approve', ['requested_by'],   { transaction: t });
      await queryInterface.addIndex('charity_request_approve', ['user_id'],        { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },


  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Drop in reverse FK dependency order
      const tables = [
        'charity_settings',
        'charity_request_approve',
        'charity_donation_item',
        'charity_donation',
        'charity_beneficiaries',
        'charity_teams',
      ];
      for (const tbl of tables) {
        await queryInterface.dropTable(tbl, { transaction: t });
      }

      // Clean up Postgres ENUM types Sequelize auto-creates
      const enums = [
        'enum_charity_beneficiaries_type',
        'enum_charity_donation_status',
        'enum_charity_donation_item_type',
        'enum_charity_donation_item_payment_method',
        'enum_charity_request_approve_action',
        'enum_charity_request_approve_status',
      ];
      for (const e of enums) {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${e}";`,
          { transaction: t }
        );
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
