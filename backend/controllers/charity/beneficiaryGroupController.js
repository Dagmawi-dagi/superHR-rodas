const { BeneficiaryGroup, Beneficiary, Employee } = require('../../models');
const { Op } = require('sequelize');

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await BeneficiaryGroup.findAll({
      where: { isActive: true },
      include: [
        { model: Employee, as: 'manager', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Beneficiary, attributes: ['beneficiaryId'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'manager', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Beneficiary }
      ]
    });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, managerEmployeeId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name required' });
    const group = await BeneficiaryGroup.create({ name, description, managerEmployeeId });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    const { name, description, managerEmployeeId, isActive } = req.body;
    await group.update({ name, description, managerEmployeeId, isActive });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    await group.update({ isActive: false });
    res.json({ success: true, message: 'Group deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignManager = async (req, res) => {
  try {
    const group = await BeneficiaryGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    const { managerEmployeeId } = req.body;
    await group.update({ managerEmployeeId });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};