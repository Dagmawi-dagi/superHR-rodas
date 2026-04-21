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
