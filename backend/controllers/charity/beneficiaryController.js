const { Beneficiary, Location, sequelize } = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------------
// GET ALL BENEFICIARIES
// ------------------------------------------------------------------
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const { type, locationId, search } = req.query;
    const where = {};

    if (type) where.type = type;
    if (locationId) where.locationId = parseInt(locationId);
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const beneficiaries = await Beneficiary.findAll({
      where,
      include: [
        {
          model: Location,
          attributes: ["locationId", "region", "city", "woreda"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ success: true, data: beneficiaries });
  } catch (error) {
    console.error("Get beneficiaries error:", error);
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
      include: [{ model: Location }],
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
    const { type, name, contactInfo, locationId } = req.body;

    if (!name || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Name and type are required" });
    }

    const beneficiary = await Beneficiary.create({
      type,
      name,
      contactInfo: contactInfo || {},
      locationId,
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
    const { type, name, contactInfo, locationId } = req.body;

    const beneficiary = await Beneficiary.findByPk(id);
    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, error: "Beneficiary not found" });
    }

    const updates = {};
    if (type !== undefined) updates.type = type;
    if (name !== undefined) updates.name = name;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;
    if (locationId !== undefined) updates.locationId = locationId;

    await beneficiary.update(updates);

    res.json({
      success: true,
      message: "Beneficiary updated",
      data: beneficiary,
    });
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
    await BeneficiaryTransfer.create({
      beneficiaryId: id,
      fromGroupId,
      toGroupId,
      reason,
      transferredBy: req.user.userId
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