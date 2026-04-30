"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationItem extends Model {
    static associate(models) {
      DonationItem.belongsTo(models.Donation, { foreignKey: "donationId" });
      DonationItem.hasMany(models.DonationDistribution, {foreignKey: "donationItemId",});
      DonationItem.hasMany(models.DonationDistributionEvidence, { foreignKey: "donationItemId" });
    }
  }

  DonationItem.init(
    {
      donationItemId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "donation_item_id",
      },
      donationId: {
        type: DataTypes.INTEGER,
        field: "donation_id",
      },
      type: {
        type: DataTypes.ENUM("money", "goods", "service"),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
      },
      unitValue: {
        type: DataTypes.DECIMAL(15, 2),
        field: "unit_value",
      },
      totalValue: {
        type: DataTypes.DECIMAL(15, 2),
        field: "total_value",
      },
      // NEW FIELDS
      paymentMethod: {
        type: DataTypes.ENUM("bank", "cash"),
        field: "payment_method",
        defaultValue: "bank",
      },
      unassignedDeduction: {
        type: DataTypes.DECIMAL(15, 2),
        field: "unassigned_deduction",
        defaultValue: 0,
      },
        status: {
    type: DataTypes.ENUM('pending', 'distributed'),
    defaultValue: 'pending',
  },
    },
    {
      sequelize,
      modelName: "DonationItem",
      tableName: "donation_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, 
      deletedAt: "deleted_at"
    },
  );

  return DonationItem;
};
