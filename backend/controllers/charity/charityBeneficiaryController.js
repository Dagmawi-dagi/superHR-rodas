'use strict';
const {
  CharityBeneficiary, CharityTeam, CharityRequestApprove,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── helpers ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const benIncludes = [
  { model: CharityTeam, as: 'team', attributes: ['teamId', 'name'] },
  { model: User,        as: 'creator', attributes: ['userId', 'fullName'] },
];

// Scope where-clause to caller's team when role is charity_teamleader
const teamScope = async (userId, role, base = {}) => {
  if (role !== 'charity_teamleader') return base;
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  if (!emp) return { ...base, beneficiaryId: -1 };
  const team = await CharityTeam.findOne({
    where: {
      [Op.or]: [
        { headEmployeeId: emp.employeeId },
        { viceEmployeeId: emp.employeeId },
        { members: { [Op.contains]: [emp.employeeId] } },
      ],
    },
    attributes: ['teamId'],
  });
  return { ...base, teamId: team ? team.teamId : -1 };
};

// ─── GET /  list ──────────────────────────────────────────────────────────────
exports.getBeneficiaries = async (req, res) => {
  try {
    const { page, size, search, type, isActive, teamId } = req.query;
    const { limit, offset } = paginate(page, size);

    let where = {};
    if (search)              where.name     = { [Op.iLike]: `%${search}%` };
    if (type)                where.type     = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (teamId)              where.teamId   = parseInt(teamId);

    where = await teamScope(req.user.userId, req.user.role, where);

    const { count, rows } = await CharityBeneficiary.findAndCountAll({
      where, include: benIncludes, limit, offset,
      order: [['name', 'ASC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getBeneficiaries:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /:id  single ─────────────────────────────────────────────────────────
exports.getBeneficiaryById = async (req, res) => {
  try {
    const ben = await CharityBeneficiary.findByPk(req.params.id, { include: benIncludes });
    if (!ben) return res.status(404).json({ success: false, error: 'Beneficiary not found' });
    res.json({ success: true, data: ben });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /  create ───────────────────────────────────────────────────────────
// charity_admin → direct creation (approved immediately)
// charity_teamleader → creates beneficiary + pending NewBeneficiary request
exports.createBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, type, fullInfo, teamId } = req.body;
    if (!name?.trim() || !type) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'name and type are required' });
    }

    const isAdmin = ['admin', 'charity_admin'].includes(req.user.role);

    const ben = await CharityBeneficiary.create(
      { name, type, fullInfo: fullInfo || {}, teamId: teamId || null,
        isActive: true, createdBy: req.user.userId },
      { transaction: t }
    );

    let request = null;
    if (!isAdmin) {
      request = await CharityRequestApprove.create({
        action: 'NewBeneficiary', requestedBy: req.user.userId, status: 'pending',
        metadata: { beneficiary_id: ben.beneficiaryId }, comments: [],
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: isAdmin ? 'Beneficiary created' : 'Beneficiary created — pending admin approval',
      data: { beneficiary: ben, request },
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /:id  update ─────────────────────────────────────────────────────────
exports.updateBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    const fields = ['name', 'type', 'fullInfo', 'teamId'];
    const updates = {};
    fields.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await ben.update(updates, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Beneficiary updated', data: ben });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /:id  soft-deactivate (is_active: false) ─────────────────────────
exports.deactivateBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }
    if (!ben.isActive) { await t.rollback(); return res.status(400).json({ success: false, error: 'Beneficiary already inactive' }); }

    await ben.update({ isActive: false }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Beneficiary deactivated' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /stats/summary ───────────────────────────────────────────────────────
exports.getBeneficiaryStats = async (req, res) => {
  try {
    let where = {};
    where = await teamScope(req.user.userId, req.user.role, where);

    const [total, active, individuals, organizations] = await Promise.all([
      CharityBeneficiary.count({ where }),
      CharityBeneficiary.count({ where: { ...where, isActive: true } }),
      CharityBeneficiary.count({ where: { ...where, type: 'individual' } }),
      CharityBeneficiary.count({ where: { ...where, type: 'organization' } }),
    ]);

    res.json({ success: true, data: { total, active, inactive: total - active, individuals, organizations } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
