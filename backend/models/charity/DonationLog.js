"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationLog extends Model {
    static associate(models) {
      DonationLog.belongsTo(models.Donation, { foreignKey: "donationId" });
      DonationLog.belongsTo(models.Employee, { foreignKey: "userId" });
    }
  }

  DonationLog.init(
    {
      logId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "log_id",
      },
      donationId: {
        type: DataTypes.INTEGER,
        field: "donation_id",
      },
      userId: {
        type: DataTypes.INTEGER,
        field: "user_id",
      },
      action: {
        type: DataTypes.STRING(100),
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "DonationLog",
      tableName: "donation_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  return DonationLog;
};
