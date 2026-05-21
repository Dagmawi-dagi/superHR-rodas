'use strict';
const { Model } = require('sequelize');

/**
 * CharityRequestApprove
 *
 * Single approval-workflow table for every charity action that needs
 * charity_admin sign-off. The `action` ENUM determines which metadata
 * fields are relevant:
 *
 *   NewBeneficiary | TransferBeneficiary  → metadata.beneficiary_id
 *   NewCharityTeam                         → metadata.charity_team_id
 *   Deduct | Increase | Transfer | Return  → metadata.donation_item_id
 *                                            metadata.recurring_interval_id (if recurring)
 *
 * comments JSON shape:
 * [ { "user_id": 3, "text": "Please clarify…", "created_at": "2026-05-19T…" } ]
 */

module.exports = (sequelize, DataTypes) => {
  class CharityRequestApprove extends Model {
    // ── Computed helpers ──────────────────────────────────────────────────────

    /** True once the request has reached a terminal state */
    get isClosed() {
      return ['approved', 'rejected'].includes(this.status);
    }

    /** Add a comment object and return the updated array */
    addComment(userId, text) {
      const updated = [...(this.comments ?? []), {
        user_id:    userId,
        text,
        created_at: new Date().toISOString(),
      }];
      this.comments = updated;
      return updated;
    }

    static associate(models) {
      // Admin the request is assigned/routed to (inbox)
      CharityRequestApprove.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'assignedAdmin',
      });

      // Who submitted the request (team leader)
      CharityRequestApprove.belongsTo(models.User, {
        foreignKey: 'requestedBy',
        as: 'requester',
      });

      // Who approved it
      CharityRequestApprove.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver',
      });

      // Who rejected it
      CharityRequestApprove.belongsTo(models.User, {
        foreignKey: 'rejectedBy',
        as: 'rejecter',
      });
    }
  }

  CharityRequestApprove.init(
    {
      requestId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'request_id',
      },
      // Admin this request is routed to
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
      action: {
        type: DataTypes.ENUM(
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
      requestedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'requested_by',
        references: { model: 'users', key: 'user_id' },
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'commented'),
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: { model: 'users', key: 'user_id' },
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rejected_by',
        references: { model: 'users', key: 'user_id' },
      },
      // When the admin took the review action (approve / reject / comment)
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
      // [ { user_id, text, created_at }, … ]
      comments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Context pointers — keys populated based on action type (see header above)
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'CharityRequestApprove',
      tableName: 'charity_request_approve',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // No paranoid — approval records should never be soft-deleted
    }
  );

  return CharityRequestApprove;
};
