"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Beneficiary extends Model {
    static associate(models) {
      Beneficiary.hasMany(models.DonationDistribution, {
        foreignKey: "beneficiaryId",
      });
      Beneficiary.belongsTo(models.DonationLocation, {
        foreignKey: "locationId",
      });
    }
  }

  Beneficiary.init(
    {
      beneficiaryId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "beneficiary_id",
      },
      type: {
        type: DataTypes.ENUM("individual", "group", "organization"),
      },
      name: {
        type: DataTypes.STRING(200),
      },
      contactInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: "contact_info",
      },
      locationId: {
        type: DataTypes.INTEGER,
        field: "location_id",
      },
    },
    {
      sequelize,
      modelName: "Beneficiary",
      tableName: "beneficiaries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return Beneficiary;
};
