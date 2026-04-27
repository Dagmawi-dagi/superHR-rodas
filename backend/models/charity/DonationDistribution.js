"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationDistribution extends Model {
    static associate(models) {
      DonationDistribution.belongsTo(models.DonationItem, {
        foreignKey: "donationItemId",
      });
      DonationDistribution.belongsTo(models.Beneficiary, {
        foreignKey: "beneficiaryId",
      });
      DonationDistribution.hasMany(models.DonationDistributionEvidence, { foreignKey: 'distribution_id' });
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
      donationItemId: {
        type: DataTypes.INTEGER,
        field: "donation_item_id",
      },
      beneficiaryId: {
        type: DataTypes.INTEGER,
        field: "beneficiary_id",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
      },
      value: {
        type: DataTypes.DECIMAL(15, 2),
      },
      // NEW FIELDS
      isReturned: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_returned" },
      returnReason: { type: DataTypes.TEXT, field: "return_reason" },
      returnedAt: { type: DataTypes.DATE, field: "returned_at" },
    },
    {
      sequelize,
      modelName: "DonationDistribution",
      tableName: "donation_distributions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return DonationDistribution;
};
