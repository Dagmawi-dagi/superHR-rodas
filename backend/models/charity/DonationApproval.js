"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationApproval extends Model {
    static associate(models) {
      DonationApproval.belongsTo(models.Donation, { foreignKey: "donationId" });
      DonationApproval.belongsTo(models.Employee, { foreignKey: "approvedBy" });
    }
  }

  DonationApproval.init(
    {
      approvalId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "approval_id",
      },
      donationId: {
        type: DataTypes.INTEGER,
        field: "donation_id",
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        field: "approved_by",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      comment: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "DonationApproval",
      tableName: "donation_approvals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  return DonationApproval;
};
