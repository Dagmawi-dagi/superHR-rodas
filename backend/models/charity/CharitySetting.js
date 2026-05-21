'use strict';
const { Model } = require('sequelize');

/**
 * CharitySetting
 *
 * One row per setting type (default key: 'main').
 * Adding a new setting type is just INSERT — no schema change needed.
 *
 * companies JSON shape:
 * [
 *   {
 *     "name":      "Ethio Telecom",
 *     "full_info": { "phone": "…", "email": "…", "address": "…" }
 *   }
 * ]
 *
 * config is a spare bucket for any future global configuration.
 */

module.exports = (sequelize, DataTypes) => {
  class CharitySetting extends Model {
    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Find a company by name (case-insensitive) */
    findCompany(name) {
      return (this.companies ?? []).find(
        c => c.name.toLowerCase() === name.toLowerCase()
      );
    }

    static associate(models) {
      // Who last updated this setting row
      CharitySetting.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'lastUpdatedBy',
      });
    }
  }

  CharitySetting.init(
    {
      settingId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'setting_id',
      },
      // 'main' | 'reporting' | … — unique per row
      settingKey: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        defaultValue: 'main',
        field: 'setting_key',
      },
      // [ { name, full_info: { phone, email, address, … } } ]
      companies: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Spare bucket for future global config
      config: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharitySetting',
      tableName: 'charity_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // No paranoid — settings should never be soft-deleted
    }
  );

  return CharitySetting;
};
