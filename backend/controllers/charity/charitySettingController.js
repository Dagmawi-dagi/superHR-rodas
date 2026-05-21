'use strict';
const { CharitySetting, User, sequelize } = require('../../models');

// ─── GET /  — get main settings row (creates default if missing) ──────────────
exports.getSettings = async (req, res) => {
  try {
    let setting = await CharitySetting.findOne({
      where: { settingKey: 'main' },
      include: [{ model: User, as: 'lastUpdatedBy', attributes: ['userId', 'fullName'] }],
    });

    if (!setting) {
      setting = await CharitySetting.create({ settingKey: 'main', companies: [], config: {} });
    }

    res.json({ success: true, data: setting });
  } catch (err) {
    console.error('getSettings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /  — replace companies list + config ─────────────────────────────────
exports.updateSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companies, config } = req.body;

    let setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });

    if (!setting) {
      setting = await CharitySetting.create(
        { settingKey: 'main', companies: companies || [], config: config || {}, updatedBy: req.user.userId },
        { transaction: t }
      );
    } else {
      const updates = { updatedBy: req.user.userId };
      if (companies !== undefined) updates.companies = companies;
      if (config    !== undefined) updates.config    = config;
      await setting.update(updates, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: 'Settings updated', data: setting });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /companies  — add a single company ──────────────────────────────────
exports.addCompany = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, fullInfo } = req.body;
    if (!name?.trim()) { await t.rollback(); return res.status(400).json({ success: false, error: 'name is required' }); }

    let setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    if (!setting) setting = await CharitySetting.create({ settingKey: 'main', companies: [], config: {} }, { transaction: t });

    const companies = [...(setting.companies || [])];
    if (companies.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Company "${name}" already exists` });
    }

    companies.push({ name, full_info: fullInfo || {} });
    await setting.update({ companies, updatedBy: req.user.userId }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Company added', data: companies });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /companies/:index  — update a company by array index ────────────────
exports.updateCompany = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idx = parseInt(req.params.index);
    const setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    if (!setting) { await t.rollback(); return res.status(404).json({ success: false, error: 'Settings not found' }); }

    const companies = [...(setting.companies || [])];
    if (idx < 0 || idx >= companies.length) {
      await t.rollback();
      return res.status(404).json({ success: false, error: `Company at index ${idx} not found` });
    }

    const { name, fullInfo } = req.body;
    if (name)     companies[idx].name      = name;
    if (fullInfo) companies[idx].full_info = fullInfo;

    await setting.update({ companies, updatedBy: req.user.userId }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Company updated', data: companies });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /companies/:index  — remove a company ────────────────────────────
exports.deleteCompany = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idx = parseInt(req.params.index);
    const setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    if (!setting) { await t.rollback(); return res.status(404).json({ success: false, error: 'Settings not found' }); }

    const companies = [...(setting.companies || [])];
    if (idx < 0 || idx >= companies.length) {
      await t.rollback();
      return res.status(404).json({ success: false, error: `Company at index ${idx} not found` });
    }

    companies.splice(idx, 1);
    await setting.update({ companies, updatedBy: req.user.userId }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Company removed', data: companies });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};
