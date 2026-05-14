'use strict';
const { BeneficiaryGroup, Beneficiary, BeneficiaryLocation, Employee, sequelize } = require('../../models');
const { Op } = require('sequelize');

// ── helper: resolve employee from user ────────────────────────────────────────
const getEmployeeIdFromUserId = async (userId) => {
  if (!userId) return null;
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  return emp ? emp.employeeId : null;
};

// ── helper: check if employee is head or vice of a group ─────────────────────
const isHeadOrVice = (group, employeeId) => {
  return (
    group.headEmployeeId === employeeId ||
    group.viceHeadEmployeeId === employeeId
  );
};

// ── GET /beneficiary-groups ───────────────────────────────────────────────────
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await BeneficiaryGroup.findAll({
      include: [
        { model: Employee, as: 'head',     attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee, as: 'viceHead', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Beneficiary, as: 'beneficiaries', attributes: ['beneficiaryId'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /beneficiary-groups/:id ───────────────────────────────────────────────
exports.getGroupById = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'head',     attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee, as: 'viceHead', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Beneficiary, as: 'beneficiaries', include: [{ model: BeneficiaryLocation, as: 'location' }] },
      ],
    });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /beneficiary-groups/:id/beneficiaries ─────────────────────────────────
// Used for the "beneficiaries icon" on the groups page — lists all beneficiaries in a group
exports.getGroupBeneficiaries = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const beneficiaries = await Beneficiary.findAll({
      where: { groupId: req.params.id },
      include: [{ model: BeneficiaryLocation }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: beneficiaries, group: { groupId: group.groupId, name: group.name } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /beneficiary-groups (charity_admin only) ─────────────────────────────
exports.createGroup = async (req, res) => {
  try {
    const { name, description, headEmployeeId, viceHeadEmployeeId, members } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });

    // Validate head exists
    if (headEmployeeId) {
      const head = await Employee.findByPk(headEmployeeId);
      if (!head) return res.status(404).json({ success: false, error: 'Head employee not found' });
    }

    // Build members list — always include head and vice
    const memberSet = new Set(members || []);
    if (headEmployeeId)     memberSet.add(headEmployeeId);
    if (viceHeadEmployeeId) memberSet.add(viceHeadEmployeeId);

    const group = await BeneficiaryGroup.create({
      name,
      description,
      headEmployeeId:     headEmployeeId     || null,
      viceHeadEmployeeId: viceHeadEmployeeId || null,
      members:            [...memberSet],
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PUT /beneficiary-groups/:id (charity_admin only) ─────────────────────────
exports.updateGroup = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const { name, description, headEmployeeId, viceHeadEmployeeId, members, isActive } = req.body;

    const memberSet = new Set(members || group.members || []);
    if (headEmployeeId     !== undefined) memberSet.add(headEmployeeId);
    if (viceHeadEmployeeId !== undefined) memberSet.add(viceHeadEmployeeId);

    await group.update({
      ...(name               !== undefined && { name }),
      ...(description        !== undefined && { description }),
      ...(headEmployeeId     !== undefined && { headEmployeeId }),
      ...(viceHeadEmployeeId !== undefined && { viceHeadEmployeeId }),
      members: [...memberSet],
      ...(isActive           !== undefined && { isActive }),
    });

    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE /beneficiary-groups/:id (charity_admin only) ──────────────────────
exports.deleteGroup = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    // Prevent deactivating a group that has active beneficiaries
    const activeBenCount = await Beneficiary.count({ where: { groupId: group.groupId } });
    if (activeBenCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot deactivate group — it still has ${activeBenCount} beneficiar${activeBenCount === 1 ? 'y' : 'ies'}. Transfer or unassign them first.`,
      });
    }

    await group.update({ isActive: false });
    res.json({ success: true, message: 'Group deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /beneficiary-groups/my-group — teamleader gets their own group ────────
exports.getMyGroup = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!employeeId) return res.status(404).json({ success: false, error: 'Employee record not found' });

    // Find any group where this employee is head, vice, or in members
    const groups = await BeneficiaryGroup.findAll({
      where: { isActive: true },
      include: [
        { model: Employee, as: 'head',     attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee, as: 'viceHead', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Beneficiary, as: 'beneficiaries', attributes: ['beneficiaryId', 'name', 'type'] },
      ],
    });

    const myGroups = groups.filter(g =>
      g.headEmployeeId === employeeId ||
      g.viceHeadEmployeeId === employeeId ||
      (g.members || []).includes(employeeId)
    );

    res.json({ success: true, data: myGroups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};