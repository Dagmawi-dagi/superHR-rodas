'use strict';
const {
  CharityTeam, CharityBeneficiary, CharityRequestApprove,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── helpers ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const teamIncludes = [
  { model: Employee, as: 'head', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
  { model: Employee, as: 'vice', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
  { model: User,     as: 'creator', attributes: ['userId', 'username', 'fullName'] },
];

// Resolve which team the caller belongs to (teamleader scope)
const getCallerTeam = async (userId) => {
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  if (!emp) return null;
  return CharityTeam.findOne({
    where: {
      isActive: true,
      [Op.or]: [
        { headEmployeeId: emp.employeeId },
        { viceEmployeeId: emp.employeeId },
        { members: { [Op.contains]: [emp.employeeId] } },
      ],
    },
  });
};

// ─── GET /  list ──────────────────────────────────────────────────────────────
exports.getTeams = async (req, res) => {
  try {
    const { page, size, search, isActive } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = {};

    if (search)              where.name     = { [Op.iLike]: `%${search}%` };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (req.user.role === 'charity_teamleader') {
      const team = await getCallerTeam(req.user.userId);
      where.teamId = team ? team.teamId : -1;
    }

    const { count, rows } = await CharityTeam.findAndCountAll({
      where, include: teamIncludes, limit, offset,
      order: [['created_at', 'DESC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getTeams:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /:id  single ─────────────────────────────────────────────────────────
exports.getTeamById = async (req, res) => {
  try {
    const team = await CharityTeam.findByPk(req.params.id, {
      include: [
        ...teamIncludes,
        { model: CharityBeneficiary, as: 'beneficiaries',
          attributes: ['beneficiaryId', 'name', 'type', 'isActive'],
          where: { isActive: true }, required: false },
      ],
    });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /:id/beneficiaries  team's beneficiary list (paginated) ──────────────
exports.getTeamBeneficiaries = async (req, res) => {
  try {
    const { page, size, search, isActive, type } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = { teamId: parseInt(req.params.id) };

    if (search)              where.name     = { [Op.iLike]: `%${search}%` };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type)                where.type     = type;

    const { count, rows } = await CharityBeneficiary.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['userId', 'fullName'] }],
      limit, offset, order: [['name', 'ASC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /  create ───────────────────────────────────────────────────────────
exports.createTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, headEmployeeId, viceEmployeeId, members } = req.body;
    if (!name?.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const team = await CharityTeam.create(
      { name, description, headEmployeeId, viceEmployeeId, members: members || [],
        isActive: true, createdBy: req.user.userId },
      { transaction: t }
    );

    // Team creation always needs admin approval if raised by a teamleader
    if (req.user.role === 'charity_teamleader') {
      await CharityRequestApprove.create({
        action: 'NewCharityTeam', requestedBy: req.user.userId, status: 'pending',
        metadata: { charity_team_id: team.teamId }, comments: [],
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, message: 'Team created', data: team });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /:id  update ─────────────────────────────────────────────────────────
exports.updateTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const team = await CharityTeam.findByPk(req.params.id, { transaction: t });
    if (!team) { await t.rollback(); return res.status(404).json({ success: false, error: 'Team not found' }); }

    const fields = ['name', 'description', 'headEmployeeId', 'viceEmployeeId', 'members'];
    const updates = {};
    fields.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await team.update(updates, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Team updated', data: team });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /:id  soft-deactivate team + all its beneficiaries ────────────────
exports.deactivateTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const team = await CharityTeam.findByPk(req.params.id, { transaction: t });
    if (!team) { await t.rollback(); return res.status(404).json({ success: false, error: 'Team not found' }); }

    await team.update({ isActive: false }, { transaction: t });

    // Cascade: deactivate all beneficiaries that belong to this team
    const affected = await CharityBeneficiary.update(
      { isActive: false },
      { where: { teamId: team.teamId, isActive: true }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: `Team deactivated. ${affected[0]} beneficiary(ies) also deactivated.` });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /:id/transfer-beneficiary  move a beneficiary to another team ───────
exports.transferBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryId, targetTeamId, reason } = req.body;
    if (!beneficiaryId || !targetTeamId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'beneficiaryId and targetTeamId are required' });
    }

    const ben  = await CharityBeneficiary.findByPk(beneficiaryId, { transaction: t });
    const team = await CharityTeam.findByPk(targetTeamId, { transaction: t });
    if (!ben)  { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }
    if (!team) { await t.rollback(); return res.status(404).json({ success: false, error: 'Target team not found' }); }

    const request = await CharityRequestApprove.create({
      action: 'TransferBeneficiary', requestedBy: req.user.userId, status: 'pending',
      metadata: {
        beneficiary_id:  ben.beneficiaryId,
        from_team_id:    ben.teamId,
        charity_team_id: targetTeamId,
        reason:          reason || '',
      },
      comments: [],
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Transfer request submitted, awaiting admin approval', data: request });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /stats/summary ───────────────────────────────────────────────────────
exports.getTeamStats = async (req, res) => {
  try {
    const total    = await CharityTeam.count();
    const active   = await CharityTeam.count({ where: { isActive: true } });
    res.json({ success: true, data: { total, active, inactive: total - active } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
