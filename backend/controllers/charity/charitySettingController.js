'use strict';
const { CharitySetting, CharityBeneficiary, CharityLog, User, sequelize } = require('../../models');

const logAction = async (action, module, targetId, details, userId) => {
  try {
    await CharityLog.create({ action, module, targetId, details, userId });
  } catch (err) {
    console.error('Charity Log Error:', err);
  }
};

// ─── GET /  — get main settings row (creates default if missing) ──────────────
exports.getSettings = async (req, res) => {
  try {
    let setting = await CharitySetting.findOne({
      where: { settingKey: 'main' },
      include: [{ model: User, as: 'lastUpdatedBy', attributes: ['userId', 'fullName'] }],
    });

    if (!setting) {
      setting = await CharitySetting.create({
        settingKey: 'main',
        distributionRelease: [],
        defaults: { monthly_allocation: 3000, payment_method: 'bank' }
      });
    }

    res.json({ success: true, data: setting });
  } catch (err) {
    console.error('getSettings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /  — update settings (admin/charity_admin only) ───────────────────────
exports.updateSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can update settings' });
    }

    const { distributionRelease, defaults } = req.body;

    let setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });

    // ── Check if any removed releases are in use ────────────────────────────
    if (setting && distributionRelease !== undefined) {
      const oldReleases = setting.distributionRelease || [];
      const newIds = (distributionRelease || []).map(r => r.distribution_release_id);
      const removedReleases = oldReleases.filter(r => !newIds.includes(r.distribution_release_id));

      for (const rel of removedReleases) {
        // Check if any beneficiary has a delivery with this release ID
        // deliveries is JSONB array: [{ "distribution_release_id": 123, ... }]
        const [usage] = await sequelize.query(
          `SELECT beneficiary_id FROM charity_beneficiaries 
           WHERE deliveries @> :match LIMIT 1`,
          {
            replacements: { match: JSON.stringify([{ distribution_release_id: rel.distribution_release_id }]) },
            transaction: t
          }
        );

        if (usage.length > 0) {
          await t.rollback();
          const dateStr = new Date(rel.date).toLocaleDateString();
          return res.status(400).json({ 
            success: false, 
            error: `Cannot remove release for "${dateStr}" because it is already linked to beneficiary deliveries.` 
          });
        }
      }
    }

    if (!setting) {
      setting = await CharitySetting.create(
        {
          settingKey: 'main',
          distributionRelease: distributionRelease || [],
          defaults: defaults || { monthly_allocation: 3000, payment_method: 'bank' },
          updatedBy: req.user.userId
        },
        { transaction: t }
      );
    } else {
      const updates = { updatedBy: req.user.userId };
      if (distributionRelease !== undefined) updates.distributionRelease = distributionRelease;
      if (defaults            !== undefined) updates.defaults            = defaults;
      await setting.update(updates, { transaction: t });
    }

    await logAction('UPDATE', 'setting', setting.settingId, { distributionRelease, defaults }, req.user.userId);

    await t.commit();
    res.json({ success: true, message: 'Settings updated', data: setting });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};
