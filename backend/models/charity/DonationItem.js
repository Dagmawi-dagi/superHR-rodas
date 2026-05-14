'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DonationItem extends Model {
    static associate(models) {
      DonationItem.belongsTo(models.Donation,     { foreignKey: 'donationId' });
      DonationItem.belongsTo(models.Beneficiary,  { foreignKey: 'beneficiaryId', as: 'beneficiary' }); // v3
      DonationItem.hasMany(models.DonationDistribution,         { foreignKey: 'donationItemId' });
      DonationItem.hasMany(models.DonationItemInterval,         { foreignKey: 'donationItemId' });
      DonationItem.hasMany(models.DonationItemAdjustmentRequest,{ foreignKey: 'donationItemId' }); // v3
    }
  }

  DonationItem.init({
    donationItemId:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'donation_item_id' },
    donationId:         { type: DataTypes.INTEGER, field: 'donation_id' },
    // v3 NEW ──────────────────────────────────────────────────────────────────
    beneficiaryId:      { type: DataTypes.INTEGER, allowNull: false, field: 'beneficiary_id' },
    distributionDate:   { type: DataTypes.DATEONLY, field: 'distribution_date' }, // scheduled, editable by charity_admin
    paymentDate:        { type: DataTypes.DATEONLY, field: 'payment_date' },       // actual, set on distribution
    // existing ────────────────────────────────────────────────────────────────
    type:               { type: DataTypes.ENUM('money', 'goods', 'service'), allowNull: false },
    description:        { type: DataTypes.STRING(255) },
    quantity:           { type: DataTypes.DECIMAL(10, 2) },
    unitValue:          { type: DataTypes.DECIMAL(15, 2), field: 'unit_value' },
    totalValue:         { type: DataTypes.DECIMAL(15, 2), field: 'total_value' },
    paymentMethod:      { type: DataTypes.ENUM('bank', 'cash'), defaultValue: 'bank', field: 'payment_method' },
    unassignedDeduction:{ type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'unassigned_deduction' },
    isRecurring:        { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_recurring' },
    status:             { type: DataTypes.ENUM('pending', 'distributed'), defaultValue: 'pending' },
  }, {
    sequelize,
    modelName: 'DonationItem',
    tableName:  'donation_items',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
    paranoid:   true,
    deletedAt:  'deleted_at',
  });

  return DonationItem;
};