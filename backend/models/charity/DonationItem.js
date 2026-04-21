"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationItem extends Model {
    static associate(models) {
      DonationItem.belongsTo(models.Donation, { foreignKey: "donationId" });
      DonationItem.hasMany(models.DonationDistribution, {
        foreignKey: "donationItemId",
      });
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
    },
    {
      sequelize,
      modelName: "DonationItem",
      tableName: "donation_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return DonationItem;
};
