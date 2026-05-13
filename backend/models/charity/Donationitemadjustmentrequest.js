'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DonationItemAdjustmentRequest extends Model {
    static associate(models) {
      DonationItemAdjustmentRequest.belongsTo(models.DonationItem,  { foreignKey: 'donationItemId', as: 'item' });
      DonationItemAdjustmentRequest.belongsTo(models.Beneficiary,   { foreignKey: 'beneficiaryId',    as: 'beneficiary' });
      DonationItemAdjustmentRequest.belongsTo(models.Beneficiary,   { foreignKey: 'toBeneficiaryId',  as: 'toBeneficiary' });
      DonationItemAdjustmentRequest.belongsTo(models.Employee,      { foreignKey: 'requestedBy',      as: 'requester' });
      DonationItemAdjustmentRequest.belongsTo(models.Employee,      { foreignKey: 'reviewedBy',       as: 'reviewer' });
    }
  }

  DonationItemAdjustmentRequest.init({
    adjustmentId:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'adjustment_id' },
    donationItemId:  { type: DataTypes.INTEGER, allowNull: false, field: 'donation_item_id' },
    beneficiaryId:   { type: DataTypes.INTEGER, allowNull: false, field: 'beneficiary_id' },
    type:            { type: DataTypes.ENUM('deduct', 'increase', 'reassign', 'return'), allowNull: false },
    amount:          { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    reason:          { type: DataTypes.TEXT, allowNull: false },
    toBeneficiaryId: { type: DataTypes.INTEGER, field: 'to_beneficiary_id' },
    status:          { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    requestedBy:     { type: DataTypes.INTEGER, allowNull: false, field: 'requested_by' },
    reviewedBy:      { type: DataTypes.INTEGER, field: 'reviewed_by' },
    adminComment:    { type: DataTypes.TEXT, field: 'admin_comment' },
  }, {
    sequelize,
    modelName: 'DonationItemAdjustmentRequest',
    tableName:  'donation_item_adjustment_requests',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
  });

  return DonationItemAdjustmentRequest;
};