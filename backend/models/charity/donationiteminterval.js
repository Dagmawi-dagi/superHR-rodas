"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationItemInterval extends Model {
    static associate(models) {
      DonationItemInterval.belongsTo(models.DonationItem, { foreignKey: "donationItemId" });
      DonationItemInterval.hasMany(models.DonationDistribution, { foreignKey: "intervalId" });
      DonationItemInterval.hasMany(models.DonationDistributionEvidence, { foreignKey: "intervalId" });
    }
  }

  DonationItemInterval.init(
    {
      intervalId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "interval_id",
      },
      donationItemId: {
        type: DataTypes.INTEGER,
        field: "donation_item_id",
      },
      intervalType: {
        type: DataTypes.ENUM("daily", "weekly", "monthly"),
        allowNull: false,
        field: "interval_type",
      },
      intervalCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "interval_count",
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "end_date",
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "completed"),
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "DonationItemInterval",
      tableName: "donation_item_intervals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return DonationItemInterval;
};