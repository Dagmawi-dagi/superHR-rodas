'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BeneficiaryGroup extends Model {
    static associate(models) {
      BeneficiaryGroup.hasMany(models.Beneficiary, { foreignKey: 'groupId', as: 'beneficiaries' });
      BeneficiaryGroup.belongsTo(models.Employee, { foreignKey: 'headEmployeeId',     as: 'head' });
      BeneficiaryGroup.belongsTo(models.Employee, { foreignKey: 'viceHeadEmployeeId', as: 'viceHead' });
      // legacy
      BeneficiaryGroup.belongsTo(models.Employee, { foreignKey: 'managerEmployeeId',  as: 'manager' });
    }
  }

  BeneficiaryGroup.init({
    groupId:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'group_id' },
    name:               { type: DataTypes.STRING(150), allowNull: false },
    description:        { type: DataTypes.TEXT },
    // v3 — new leadership fields
    headEmployeeId:     { type: DataTypes.INTEGER, field: 'head_employee_id' },
    viceHeadEmployeeId: { type: DataTypes.INTEGER, field: 'vice_head_employee_id' },
    members:            { type: DataTypes.JSONB, defaultValue: [] }, // array of employee_id
    // legacy
    managerEmployeeId:  { type: DataTypes.INTEGER, field: 'manager_employee_id' },
    isActive:           { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  }, {
    sequelize,
    modelName: 'BeneficiaryGroup',
    tableName:  'beneficiary_groups',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
    deletedAt:  'deleted_at',
    paranoid:   true,
  });

  return BeneficiaryGroup;
};