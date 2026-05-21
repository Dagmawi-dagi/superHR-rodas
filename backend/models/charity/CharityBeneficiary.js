'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityBeneficiary extends Model {
    static associate(models) {
      // Which team this beneficiary belongs to
      CharityBeneficiary.belongsTo(models.CharityTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });

      // Who registered this beneficiary
      CharityBeneficiary.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      // Donation items targeting this beneficiary
      CharityBeneficiary.hasMany(models.CharityDonationItem, {
        foreignKey: 'beneficiaryId',
        as: 'donationItems',
      });
    }
  }

  CharityBeneficiary.init(
    {
      beneficiaryId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'beneficiary_id',
      },
      // Top-level name — index-friendly for list views / search
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true },
      },
      type: {
        type: DataTypes.ENUM('individual', 'organization'),
        allowNull: false,
      },
      // Future-proof info bag:
      // { location: { region, city, woreda }, contact: { phone, email }, … }
      fullInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'full_info',
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'team_id',
        references: { model: 'charity_teams', key: 'team_id' },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
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
      modelName: 'CharityBeneficiary',
      tableName: 'charity_beneficiaries',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityBeneficiary;
};
