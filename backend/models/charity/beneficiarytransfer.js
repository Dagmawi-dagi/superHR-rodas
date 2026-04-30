"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BeneficiaryTransfer extends Model {
    static associate(models) {
      BeneficiaryTransfer.belongsTo(models.Beneficiary, { foreignKey: "beneficiaryId" });
      BeneficiaryTransfer.belongsTo(models.BeneficiaryGroup, { as: "fromGroup", foreignKey: "fromGroupId" });
      BeneficiaryTransfer.belongsTo(models.BeneficiaryGroup, { as: "toGroup", foreignKey: "toGroupId" });
      BeneficiaryTransfer.belongsTo(models.Employee, { foreignKey: "transferredBy" });
    }
  }

  BeneficiaryTransfer.init(
    {
      transferId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "transfer_id",
      },
      beneficiaryId: {
        type: DataTypes.INTEGER,
        field: "beneficiary_id",
      },
      fromGroupId: {
        type: DataTypes.INTEGER,
        field: "from_group_id",
      },
      toGroupId: {
        type: DataTypes.INTEGER,
        field: "to_group_id",
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      transferredBy: {
        type: DataTypes.INTEGER,
        field: "transferred_by",
      },
    },
    {
      sequelize,
      modelName: "BeneficiaryTransfer",
      tableName: "beneficiary_transfers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      
    }
  );

  return BeneficiaryTransfer;
};