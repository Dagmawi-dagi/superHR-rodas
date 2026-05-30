'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityDonation extends Model {
    static associate(models) {
      // Which team owns this donation
      CharityDonation.belongsTo(models.CharityTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });
      // The teamleader/admin who created the draft
      CharityDonation.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });
      // Line items
      CharityDonation.hasMany(models.CharityDonationItem, {
        foreignKey: 'donationId',
        as: 'items',
      });
    }
  }

  CharityDonation.init(
    {
      donationId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'donation_id',
      },
      teamId: {
        type: DataTypes.INTEGER,
        field: 'team_id',
      },
      totalValueInBirr: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_value_in_birr',
      },
      description: {
        type: DataTypes.TEXT,
      },
      donationDeliveryDate: {
        type: DataTypes.DATEONLY,
        field: 'donation_delivery_date',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        field: 'created_by',
      },
    },
    {
      sequelize,
      modelName: 'CharityDonation',
      tableName: 'charity_donation',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityDonation;
};
