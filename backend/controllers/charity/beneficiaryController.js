const { Beneficiary, BeneficiaryLocation, BeneficiaryGroup, Employee, BeneficiaryTransfer, sequelize } = require("../../models");
const { Op } = require("sequelize");
// ------------------------------------------------------------------
// helpers 
// ------------------------------------------------------------------

const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

const buildSortingOptions = (sortBy, sortOrder, allowedFields = ['name', 'type', 'created_at']) => {
  const field = allowedFields.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return [[field, order]];
};

const getEmployeeIdFromUserId = async (userId) => {
  if (!userId) return null;
  const employee = await Employee.findOne({
    where: { userId },
    attributes: ['employeeId']
  });
  return employee ? employee.employeeId : null;
};
// ------------------------------------------------------------------
// GET ALL BENEFICIARIES
// ------------------------------------------------------------------
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const { page, size, sortBy, sortOrder, type, groupId, locationId, search, createdBy } = req.query;
    const { limit, offset } = getPagination(page, size);
    const where = {};

    if (type && type.trim() !== '') {
      where.type = type;
    }
    if (groupId && groupId !== 'all') {
      where.groupId = parseInt(groupId);
    }
    if (locationId && locationId !== 'all') {
      where.locationId = parseInt(locationId);
    }
    if (search && search.trim() !== '') {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (createdBy) {
      where.createdBy = parseInt(createdBy);
    }

    // charity_teamleader: can only see beneficiaries in their groups
    if (req.user.role === 'charity_teamleader') {
      const employeeId = await getEmployeeIdFromUserId(req.user.userId);
      const involvedGroups = await BeneficiaryGroup.findAll({
        where: {
          [Op.or]: [
            { headEmployeeId: employeeId },
            { viceHeadEmployeeId: employeeId },
            { members: { [Op.contains]: [employeeId] } }
          ]
        },
        attributes: ['groupId']
      });
      const involvedGroupIds = involvedGroups.map(g => g.groupId);

      if (where.groupId) {
        if (!involvedGroupIds.includes(parseInt(where.groupId))) {
          where.groupId = -1; // Force no results if they requested a group they are not in
        }
      } else {
        where.groupId = { [Op.in]: involvedGroupIds };
      }
    }

    const allowedSortFields = ['name', 'type', 'created_at'];
    const order = buildSortingOptions(sortBy, sortOrder, allowedSortFields);

    const { count, rows: beneficiaries } = await Beneficiary.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: BeneficiaryLocation,
          attributes: ['locationId', 'region', 'city', 'woreda']
        },
        {
          model: BeneficiaryGroup,
          attributes: ['groupId', 'name'],
          include: {
            model: Employee,
            as: 'manager',
            attributes: ['employeeId', 'firstName', 'lastName']
          }
        },
        {
          model: Employee,
          as: 'creator',
          attributes: ['employeeId', 'firstName', 'lastName']
        }
      ],
      distinct: true,
    });

    res.json({
      success: true,
      data: beneficiaries,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page) || 1,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET BENEFICIARY BY ID
// ------------------------------------------------------------------
exports.getBeneficiaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await Beneficiary.findByPk(id, {
      include: [
        { model: BeneficiaryLocation },
        { model: Employee, as: 'creator', attributes: ['employeeId', 'firstName', 'lastName'] }
      ],
    });

    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, error: "Beneficiary not found" });
    }

    res.json({ success: true, data: beneficiary });
  } catch (error) {
    console.error("Get beneficiary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// CREATE BENEFICIARY
// ------------------------------------------------------------------
exports.createBeneficiary = async (req, res) => {
  try {
    const { type, name, contactInfo, locationId, groupId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, error: "Name and type are required" });
    }

    // Validate group existence if groupId given
    if (groupId) {
      const group = await BeneficiaryGroup.findByPk(groupId);
      if (!group) {
        return res.status(400).json({ success: false, error: "Beneficiary group not found" });
      }
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    const beneficiary = await Beneficiary.create({
      type,
      name,
      contactInfo: contactInfo || {},
      locationId: locationId || null,
      groupId: groupId || null,   // Now works because the model has this field
      createdBy: employeeId,
    });

    res.status(201).json({
      success: true,
      message: "Beneficiary created",
      data: beneficiary,
    });
  } catch (error) {
    console.error("Create beneficiary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE BENEFICIARY
// ------------------------------------------------------------------
exports.updateBeneficiary = async (req, res) => {
try {
    const { id } = req.params;
    const { type, name, contactInfo, locationId, groupId } = req.body;

    const beneficiary = await Beneficiary.findByPk(id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, error: "Beneficiary not found" });
    }

    const updates = {};
    if (type !== undefined) updates.type = type;
    if (name !== undefined) updates.name = name;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;
    if (locationId !== undefined) updates.locationId = locationId;
    if (groupId !== undefined) updates.groupId = groupId;   // allow group change

    await beneficiary.update(updates);

    res.json({ success: true, message: "Beneficiary updated", data: beneficiary });
  } catch (error) {
    console.error("Update beneficiary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE BENEFICIARY
// ------------------------------------------------------------------
exports.deleteBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await Beneficiary.findByPk(id);
    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, error: "Beneficiary not found" });
    }

    // Check if beneficiary has distributions (optional safeguard)
    // You could add a check and prevent deletion if linked to distributions

    await beneficiary.destroy();

    res.json({ success: true, message: "Beneficiary deleted" });
  } catch (error) {
    console.error("Delete beneficiary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



exports.transferBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { toGroupId, reason } = req.body;
    if (!toGroupId || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'toGroupId and reason required' });
    }
    const beneficiary = await Beneficiary.findByPk(id, { transaction: t });
    if (!beneficiary) throw new Error('Beneficiary not found');
    const toGroup = await BeneficiaryGroup.findByPk(toGroupId, { transaction: t });
    if (!toGroup) throw new Error('Target group not found');
    const fromGroupId = beneficiary.groupId;
    beneficiary.groupId = toGroupId;
    await beneficiary.save({ transaction: t });
    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await BeneficiaryTransfer.create({
      beneficiaryId: id,
      fromGroupId,
      toGroupId,
      reason,
      transferredBy: employeeId
    }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Beneficiary transferred' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTransferHistory = async (req, res) => {
  try {
    const transfers = await BeneficiaryTransfer.findAll({
      where: { beneficiaryId: req.params.id },
      include: [
        { model: BeneficiaryGroup, as: 'fromGroup', attributes: ['name'] },
        { model: BeneficiaryGroup, as: 'toGroup', attributes: ['name'] },
        { model: Employee, attributes: ['firstName', 'lastName'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};