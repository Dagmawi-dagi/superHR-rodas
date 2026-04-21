"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DonationLocation extends Model {
    static associate(models) {
      DonationLocation.hasMany(models.Beneficiary, {
        foreignKey: "locationId",
      });
    }
  }

  DonationLocation.init(
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
      modelName: "DonationLocation",
      tableName: "donation_locations",
      timestamps: false,
    },
  );

  return DonationLocation;
};
