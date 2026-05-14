"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationDistributionEvidence extends Model {
    static associate(models) {
      DonationDistributionEvidence.belongsTo(models.Donation, { foreignKey: "donationId" });
      DonationDistributionEvidence.belongsTo(models.Employee, { foreignKey: "uploadedBy" });
      DonationDistributionEvidence.belongsTo(models.DonationItemInterval, { foreignKey: "intervalId" });
    }
  }

  DonationDistributionEvidence.init(
    {
      evidenceId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "evidence_id",
      },
      donationId: {
        type: DataTypes.INTEGER,
        field: "donation_id",
      },
      intervalId: {
        type: DataTypes.INTEGER,
        field: "interval_id",
        },
      fileUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "file_url",
      },
      fileName: { type: DataTypes.STRING(255), field: "file_name" },
      fileType: { type: DataTypes.STRING(50), field: "file_type" },
      uploadedBy: { type: DataTypes.INTEGER, field: "uploaded_by" },
    },
    {
      sequelize,
      modelName: "DonationDistributionEvidence",
      tableName: "donation_distribution_evidences",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  return DonationDistributionEvidence;
};