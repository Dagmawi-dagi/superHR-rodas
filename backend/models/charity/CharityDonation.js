'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityDonation extends Model {
    static associate(models) {
      // Which team owns this donation batch
      CharityDonation.belongsTo(models.CharityTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });

      // Who created the donation
      CharityDonation.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      // All items inside this donation
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
        allowNull: true,
        field: 'team_id',
        references: { model: 'charity_teams', key: 'team_id' },
      },
      // Maintained by app logic: sum of all donation_item.totalValueInBirr
      totalValueInBirr: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_value_in_birr',
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'cancelled'),
        defaultValue: 'draft',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Global target delivery date for every item in this donation batch
      donationDeliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'donation_delivery_date',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
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
