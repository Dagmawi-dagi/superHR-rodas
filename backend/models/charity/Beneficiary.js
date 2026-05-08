"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Beneficiary extends Model {
    static associate(models) {
      Beneficiary.hasMany(models.DonationDistribution, { foreignKey: "beneficiary_id"});
      Beneficiary.belongsTo(models.BeneficiaryLocation, { foreignKey: "location_id",});
      Beneficiary.belongsTo(models.BeneficiaryGroup, { foreignKey: "group_id" });
      Beneficiary.hasMany(models.BeneficiaryTransfer, { foreignKey: "beneficiary_id" });
      Beneficiary.belongsTo(models.Employee, { foreignKey: "createdBy", as: "creator" });
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
        type: DataTypes.ENUM("individual", "organization"),
        allowNull:false
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
      groupId: {
        type: DataTypes.INTEGER,
        field: "group_id",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        field: "created_by",
      },
    },

    {
      sequelize,
      modelName: "Beneficiary",
      tableName: "beneficiaries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      paranoid: true, 
      
    },
  );

  return Beneficiary;
};
