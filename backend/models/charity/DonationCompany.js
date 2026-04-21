"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationCompany extends Model {
    static associate(models) {
      DonationCompany.hasMany(models.Donation, { foreignKey: "companyId" });
    }
  }

  DonationCompany.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "company_id",
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("main", "sister", "partner"),
        defaultValue: "main",
      },
      contactInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: "contact_info",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      modelName: "DonationCompany",
      tableName: "donation_companies",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return DonationCompany;
};
