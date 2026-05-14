"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BeneficiaryLocation extends Model {
    static associate(models) {
      BeneficiaryLocation.hasMany(models.Beneficiary, {
        foreignKey: "locationId",
      });
    }
  }

  BeneficiaryLocation.init(
    {
      locationId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "location_id",
      },
      region: DataTypes.STRING(100),
      city: DataTypes.STRING(100),
      woreda: DataTypes.STRING(100),
      description: DataTypes.STRING(255),
    },
    {
      sequelize,
      modelName: "BeneficiaryLocation",
      tableName: "beneficiary_locations",
      timestamps: false,
    },
  );

  return BeneficiaryLocation;
};
