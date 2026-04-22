"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationDeduction extends Model {
    static associate(models) {
      DonationDeduction.belongsTo(models.DonationItem, { foreignKey: "donationItemId" });
      DonationDeduction.belongsTo(models.Beneficiary, { foreignKey: "reassignedToBeneficiaryId", as: "reassignedTo" });
      DonationDeduction.belongsTo(models.Employee, { foreignKey: "createdBy" });
    }
  }

  DonationDeduction.init(
    {
      deductionId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "deduction_id",
      },
      donationItemId: {
        type: DataTypes.INTEGER,
        field: "donation_item_id",
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      reassignedToBeneficiaryId: {
        type: DataTypes.INTEGER,
        field: "reassigned_to_beneficiary_id",
      },
      deductionDate: {
        type: DataTypes.DATEONLY,
        field: "deduction_date",
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        field: "created_by",
      },
    },
    {
      sequelize,
      modelName: "DonationDeduction",
      tableName: "donation_deductions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return DonationDeduction;
};