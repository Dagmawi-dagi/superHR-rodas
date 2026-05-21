'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityTeam extends Model {
    static associate(models) {
      // Who leads and vice-leads the team (employees)
      CharityTeam.belongsTo(models.Employee, {
        foreignKey: 'headEmployeeId',
        as: 'head',
      });
      CharityTeam.belongsTo(models.Employee, {
        foreignKey: 'viceEmployeeId',
        as: 'vice',
      });

      // Who created the team (user)
      CharityTeam.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      // Beneficiaries that belong to this team
      CharityTeam.hasMany(models.CharityBeneficiary, {
        foreignKey: 'teamId',
        as: 'beneficiaries',
      });

      // Donations initiated by this team
      CharityTeam.hasMany(models.CharityDonation, {
        foreignKey: 'teamId',
        as: 'donations',
      });
    }
  }

  CharityTeam.init(
    {
      teamId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'team_id',
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      headEmployeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'head_employee_id',
        references: { model: 'employees', key: 'employee_id' },
      },
      viceEmployeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'vice_employee_id',
        references: { model: 'employees', key: 'employee_id' },
      },
      // Array of employee_id integers e.g. [3, 7, 12]
      members: {
        type: DataTypes.JSONB,
        defaultValue: [],
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
      modelName: 'CharityTeam',
      tableName: 'charity_teams',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityTeam;
};
