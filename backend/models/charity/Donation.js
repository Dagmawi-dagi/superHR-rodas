"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Donation extends Model {
    static associate(models) {
      Donation.belongsTo(models.DonationCompany, { foreignKey: "companyId" });
      Donation.belongsTo(models.Campaign, { foreignKey: "campaignId" });
      Donation.hasMany(models.DonationItem, { foreignKey: "donationId" });
      Donation.hasMany(models.DonationApproval, { foreignKey: "donationId" });
      Donation.hasMany(models.DonationLog, { foreignKey: "donationId" });
      Donation.belongsTo(models.Employee, { foreignKey: "createdBy", as: "creator" });
      Donation.belongsTo(models.Employee, { foreignKey: "approvedBy", as: "approver" });
      Donation.belongsTo(models.Employee, { foreignKey: "distributedBy", as: "distributor" });
    }
  }

  Donation.init(
    {
      donationId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "donation_id",
      },
      companyId: { type: DataTypes.INTEGER, field: "company_id" },
      campaignId: { type: DataTypes.INTEGER, field: "campaign_id" },
      donationDate: { type: DataTypes.DATEONLY, field: "donation_date" },
      totalValue: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "total_value",
      },
      status: {
        type: DataTypes.ENUM("draft", "pending", "approved", "distributed", "cancelled"),
        defaultValue: "draft",
      },
      notes: { type: DataTypes.TEXT },
      createdBy: { type: DataTypes.INTEGER, field: "created_by" },
      approvedBy: { type: DataTypes.INTEGER, field: "approved_by" },
      distributedBy: { type: DataTypes.INTEGER, field: "distributed_by" },
    },
    {
      sequelize,
      modelName: "Donation",
      tableName: "donations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true, 
      deletedAt: "deleted_at"
    },
  );

  return Donation;
};