'use strict';
const { Model } = require('sequelize');

/**
 * CharityDonationItem
 *
 * Handles both one-time and recurring donations.
 *
 * isRecurring = null            → one-time item
 * isRecurring = { … }           → recurring item; see JSON shape below
 *
 * isRecurring JSON shape:
 * {
 *   "recurring_type":  "monthly" | "weekly" | "daily",
 *   "recurring_count": 3,
 *   "recurrings": [
 *     {
 *       "recurring_id":        1,
 *       "quantity":            10.00,
 *       "unit_value_in_birr":  500.00,
 *       "total_value_in_birr": 5000.00,
 *       "payment_method":     "bank" | "cash",
 *       "is_delivered":        false,
 *       "is_returned":         null | { "reason": "…" },
 * bankReceipts, if the itemType===money
 * onAdjustment,
 *     }
 *   ]
 * }
 *
 * isReturned JSON shape:
 * null | { "reason": "beneficiary relocated" }
 *
 * bankReceipts JSON shape:
 * [ "https://storage/…/receipt1.pdf", "…" ]
 */

module.exports = (sequelize, DataTypes) => {
  class CharityDonationItem extends Model {
    // ── Computed helpers ──────────────────────────────────────────────────────

    /** True if this item uses the recurring schedule */
    get isRecurringItem() {
      return this.isRecurring !== null && this.isRecurring !== undefined;
    }

    /** Total number of intervals (0 for one-time items) */
    get recurringCount() {
      return this.isRecurring?.recurring_count ?? 0;
    }

    /** Array of interval objects, empty for one-time items */
    get recurringIntervals() {
      return this.isRecurring?.recurrings ?? [];
    }

    /** Count of delivered intervals */
    get deliveredCount() {
      return this.recurringIntervals.filter(r => r.is_delivered).length;
    }

    static associate(models) {
      // Parent donation
      CharityDonationItem.belongsTo(models.CharityDonation, {
        foreignKey: 'donationId',
        as: 'donation',
      });

      // Target beneficiary
      CharityDonationItem.belongsTo(models.CharityBeneficiary, {
        foreignKey: 'beneficiaryId',
        as: 'beneficiary',
      });

      // Who created this item
      CharityDonationItem.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });
    }
  }

  CharityDonationItem.init(
    {
      donationItemId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'donation_item_id',
      },
      donationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'donation_id',
        references: { model: 'charity_donation', key: 'donation_id' },
      },
      beneficiaryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'beneficiary_id',
        references: { model: 'charity_beneficiaries', key: 'beneficiary_id' },
      },
      type: {
        type: DataTypes.ENUM('money', 'goods', 'service'),
        allowNull: false,
      },
      // Short label: "Rice bags", "School uniform", "Consultation fee", …
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // ── Top-level (one-time) fields ─────────────────────────────────────────
      // Irrelevant when isRecurring is set; unit × quantity = total
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      unitValueInBirr: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        field: 'unit_value_in_birr',
      },
      totalValueInBirr: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        field: 'total_value_in_birr',
      },
      paymentMethod: {
        type: DataTypes.ENUM('bank', 'cash'),
        defaultValue: 'bank',
        field: 'payment_method',
      },
      // ── Recurring config ────────────────────────────────────────────────────
      // null = one-time item.  Object = recurring config + intervals array.
      isRecurring: {
        type: DataTypes.JSONB,
        defaultValue: null,
        field: 'is_recurring',
      },
      // ── Return / delivery state ─────────────────────────────────────────────
      // null = not returned.  { reason: "…" } = returned.
      isReturned: {
        type: DataTypes.JSONB,
        defaultValue: null,
        field: 'is_returned',
      },
      isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_delivered',
      },
      // Array of file-URL strings for bank transfer receipts / evidence
      bankReceipts: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'bank_receipts',
      },
      // Tracks an in-flight adjustment request for this item.
      // null → no active request
      // { adjustment_id: <requestId>, status: 'draft'|'approved'|'rejected'|'commented' }
      onAdjustment: {
        type: DataTypes.JSONB,
        defaultValue: null,
        field: 'on_adjustment',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharityDonationItem',
      tableName: 'charity_donation_item',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityDonationItem;
};
