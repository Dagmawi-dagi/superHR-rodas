"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationDistribution extends Model {
    static associate(models) {
      DonationDistribution.belongsTo(models.DonationItem, { foreignKey: "donationItemId" });
      DonationDistribution.belongsTo(models.Beneficiary, { foreignKey: "beneficiaryId" });
      // No longer associated with DonationDistributionEvidence
      DonationDistribution.belongsTo(models.DonationItemInterval, { foreignKey: "intervalId" });
    }
  }

  DonationDistribution.init(
    {
      distributionId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "distribution_id",
      },
      intervalId: {
        type: DataTypes.INTEGER,
        field: "interval_id",
      },
      donationItemId: { type: DataTypes.INTEGER, field: "donation_item_id" },
      beneficiaryId: { type: DataTypes.INTEGER, field: "beneficiary_id" },
      quantity: { type: DataTypes.DECIMAL(10, 2) },
      value: { type: DataTypes.DECIMAL(15, 2) },
      isReturned: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_returned" },
      returnReason: { type: DataTypes.TEXT, field: "return_reason" },
      returnedAt: { type: DataTypes.DATE, field: "returned_at" },
    },
    {
      sequelize,
      modelName: "DonationDistribution",
      tableName: "donation_distributions",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at"
    },
  );

  return DonationDistribution;
};