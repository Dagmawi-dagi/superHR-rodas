"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    static associate(models) {
      Campaign.hasMany(models.Donation, { foreignKey: "campaignId" });
      Campaign.belongsTo(models.Employee, { foreignKey: "createdBy" });
    }
  }

  Campaign.init(
    {
      campaignId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "campaign_id",
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.STRING(100),
      },
      startDate: {
        type: DataTypes.DATEONLY,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        field: "end_date",
      },
      status: {
        type: DataTypes.ENUM("inactive", "active", "completed", "cancelled"),
        defaultValue: "inactive",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        field: "created_by",
      },
       // NEW FIELDS
      actualEndDate: { type: DataTypes.DATEONLY, field: "actual_end_date" },
      terminationReason: { type: DataTypes.TEXT, field: "termination_reason" },
      extensionReason: { type: DataTypes.TEXT, field: "extension_reason" },
    },
    {
      sequelize,
      modelName: "Campaign",
      tableName: "campaigns",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, 
      deletedAt: "deleted_at"
    },
  );

  return Campaign;
};