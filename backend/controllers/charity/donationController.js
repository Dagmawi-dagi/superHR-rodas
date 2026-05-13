const {
  Donation,
  DonationItem,
  DonationApproval,
  DonationLog,
  DonationDistribution,
  DonationDistributionEvidence,
  DonationCompany,
  DonationItemInterval,
  Campaign,
  Beneficiary,
  Employee,
  DonationDeduction,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------------
// PAGINATION HELPER
// ------------------------------------------------------------------
const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};


// ------------------------------------------------------------------
// MONEY HELPER — always round to 2 decimal places
// ------------------------------------------------------------------
const money = (val) => Math.round(parseFloat(val || 0) * 100) / 100;

// ------------------------------------------------------------------
// RECALCULATE DONATION TOTAL
// ------------------------------------------------------------------
const recalculateDonationTotal = async (donationId, transaction = null) => {
  // Sum all item total values
  const items = await DonationItem.findAll({
    where: { donationId },
    attributes: ['totalValue'],
    transaction,
  });
  const total = items.reduce((sum, item) => sum + money(item.totalValue), 0);

  const effectiveTotal = money(total);

  await Donation.update(
    { totalValue: effectiveTotal },
    { where: { donationId }, transaction },
  );
  return effectiveTotal;
};

// ------------------------------------------------------------------
// LOG ACTION
// ------------------------------------------------------------------
const logDonationAction = async (
  donationId,
  userId,
  action,
  metadata = {},
  transaction = null,
) => {
  await DonationLog.create(
    {
      donationId,
      userId,
      action,
      metadata,
    },
    { transaction },
  );
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
// CREATE DONATION (status: draft)
// ------------------------------------------------------------------
exports.createDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, campaignId, donationDate, notes } = req.body;

    // Basic field presence
    if (!companyId || !campaignId || !donationDate) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "companyId, campaignId, and donationDate are required",
      });
    }

    // Company existence
    const company = await DonationCompany.findByPk(companyId, { transaction: t });
    if (!company) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Company (donor) not found" });
    }

    // NEW: Company must be active
    if (!company.isActive) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Company "${company.name}" is currently inactive. Donations can only be made to active companies.`,
      });
    }

    // Campaign existence with full details
    const campaign = await Campaign.findByPk(campaignId, { transaction: t });
    if (!campaign) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    // 1. Campaign must be active
    if (campaign.status !== "active") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Campaign "${campaign.title}" is not active (current status: ${campaign.status}). Only active campaigns can receive donations.`,
      });
    }

    // 2. Donation date must be within campaign start/end dates
    const campaignStart = campaign.startDate ? new Date(campaign.startDate) : null;
    const campaignEnd = campaign.endDate ? new Date(campaign.endDate) : null;
    const donationDateObj = new Date(donationDate);

    if (campaignStart && donationDateObj < campaignStart) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Donation date (${donationDate}) is before the campaign start date (${campaign.startDate}).`,
      });
    }

    if (campaignEnd && donationDateObj > campaignEnd) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Donation date (${donationDate}) is after the campaign end date (${campaign.endDate}).`,
      });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    // Create the donation
    const donation = await Donation.create(
      {
        companyId,
        campaignId,
        donationDate,
        notes,
        status: "draft",
        totalValue: 0,
        createdBy: employeeId,
      },
      { transaction: t }
    );
    await logDonationAction(
      donation.donationId,
      employeeId,
      "CREATE",
      {
        company: company.name,
        campaign: campaign.title,
      },
      t
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Donation created (draft)",
      data: donation,
    });
  } catch (error) {
    await t.rollback();
    console.error("Create donation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET ALL DONATIONS (with filters & pagination)
// ------------------------------------------------------------------
exports.getAllDonations = async (req, res) => {
  try {
    const {
      page = 1,
      size = 10,
      status,
      companyId,
      campaignId,
      startDate,
      endDate,
      search,
    } = req.query;
    const { limit, offset } = getPagination(page, size);

    const where = {};
    if (status) where.status = status;
    if (companyId) where.companyId = parseInt(companyId);
    if (campaignId) where.campaignId = parseInt(campaignId);
    if (startDate && endDate) {
      where.donationDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.donationDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.donationDate = { [Op.lte]: endDate };
    }

    const include = [
      { model: DonationCompany, attributes: ["companyId", "name", "type"] },
      { model: Campaign, attributes: ["campaignId", "title", "category"] },
      { model: Employee, as: "creator", attributes: ["employeeId", "firstName", "lastName"] },
      { model: Employee, as: "approver", attributes: ["employeeId", "firstName", "lastName"] },
      { model: Employee, as: "distributor", attributes: ["employeeId", "firstName", "lastName"] },
    ];

    const { count, rows } = await Donation.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET DONATION BY ID (full details)
// ------------------------------------------------------------------
exports.getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findByPk(id, {
      include: [
        { model: DonationCompany, attributes: ['companyId', 'name', 'type', 'contactInfo'] },
        { model: Campaign, attributes: ['campaignId', 'title', 'description', 'category', 'targetAmount'] },
        { model: Employee, as: 'creator', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee, as: 'approver', attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee, as: 'distributor', attributes: ['employeeId', 'firstName', 'lastName'] },
        {
          model: DonationItem,
          include: [
            {
              model: DonationDistribution,
              include: [
                { model: Beneficiary, attributes: ['beneficiaryId', 'name', 'type', 'groupId'] }
              ]
            },
            {
              model: DonationDistributionEvidence   // direct under DonationItem, not under DonationDistribution
            },
            {
              model: DonationItemInterval   // ← add this
            },
            {
              model: DonationDeduction,
              include: [
                { model: Beneficiary, as: 'reassignedTo', attributes: ['name'] },
                { model: Beneficiary, as: 'fromBeneficiary', attributes: ['name'] }
              ]
            }
          ]
        },
        {
          model: DonationApproval,
          include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!donation) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    res.json({ success: true, data: donation });
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE DONATION (draft only)
// ------------------------------------------------------------------
exports.updateDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { companyId, campaignId, donationDate, notes } = req.body;

    const donation = await Donation.findByPk(id, { transaction: t });
    if (!donation) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: "Donation not found" });
    }

    if (donation.status !== "draft") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: "Only draft donations can be edited" });
    }

    const updates = {};
    if (companyId !== undefined) updates.companyId = companyId;
    if (campaignId !== undefined) updates.campaignId = campaignId;
    if (donationDate !== undefined) updates.donationDate = donationDate;
    if (notes !== undefined) updates.notes = notes;

    await donation.update(updates, { transaction: t });
    const _empUpdate = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(id, _empUpdate, "UPDATE", updates, t);

    await t.commit();
    res.json({ success: true, message: "Donation updated", data: donation });
  } catch (error) {
    await t.rollback();
    console.error("Update donation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// CANCEL DONATION (any status → cancelled)
// ------------------------------------------------------------------
exports.cancelDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const donation = await Donation.findByPk(id, { transaction: t });
    if (!donation) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: "Donation not found" });
    }

    if (donation.status === "cancelled") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: "Donation already cancelled" });
    }

    await donation.update({ status: "cancelled" }, { transaction: t });
    const _empCancel = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(id, _empCancel, "CANCEL", {}, t);

    await t.commit();
    res.json({ success: true, message: "Donation cancelled" });
  } catch (error) {
    await t.rollback();
    console.error("Cancel donation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// ADD DONATION ITEM (draft only)
// ------------------------------------------------------------------
exports.addDonationItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { type, description, quantity, unitValue, paymentMethod, interval, beneficiaryId, distributionDate } = req.body;

    // Validate required fields
    if (!type || quantity === undefined || unitValue === undefined || !beneficiaryId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "type, quantity, unitValue, and beneficiaryId are required" });
    }

    const donation = await Donation.findByPk(id, { transaction: t });
    if (!donation || donation.status !== "draft") {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Donation not found or not editable" });
    }

    // Validate beneficiary
    const beneficiary = await Beneficiary.findByPk(beneficiaryId, { transaction: t });
    if (!beneficiary) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Beneficiary not found" });
    }

    const baseTotal = money(parseFloat(quantity) * parseFloat(unitValue));
    let finalTotal = baseTotal;
    let intervalsToCreate = [];

    // Handle interval / recurring
    if (interval && interval.intervalType && interval.intervalCount && interval.startDate) {
      if (!["daily", "weekly", "monthly"].includes(interval.intervalType)) {
        throw new Error("Invalid interval type");
      }
      const count = parseInt(interval.intervalCount);
      if (isNaN(count) || count <= 0)
        throw new Error("Interval count must be positive");

      for (let i = 0; i < count; i++) {
        let start = new Date(interval.startDate);
        let end = new Date(interval.startDate);

        if (interval.intervalType === "daily") {
          start.setDate(start.getDate() + i);
          end.setDate(end.getDate() + i);
        } else if (interval.intervalType === "weekly") {
          start.setDate(start.getDate() + i * 7);
          end.setDate(end.getDate() + (i + 1) * 7 - 1);
        } else if (interval.intervalType === "monthly") {
          start.setMonth(start.getMonth() + i);
          end.setMonth(end.getMonth() + i + 1);
          end.setDate(end.getDate() - 1);
        }

        intervalsToCreate.push({
          intervalType: interval.intervalType,
          intervalCount: i + 1, // Use as sequence number
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          status: "pending",
        });
      }
      finalTotal = money(baseTotal * count); // grand total over all intervals
    }

    const item = await DonationItem.create(
      {
        donationId: id,
        beneficiaryId,
        distributionDate: distributionDate || null,
        type,
        description,
        quantity,
        unitValue,
        totalValue: finalTotal,
        paymentMethod: type === "money" ? paymentMethod || "bank" : null,
        isRecurring: intervalsToCreate.length > 0,
      },
      { transaction: t }
    );

    if (intervalsToCreate.length > 0) {
      for (const inv of intervalsToCreate) {
        await DonationItemInterval.create(
          {
            donationItemId: item.donationItemId,
            ...inv,
          },
          { transaction: t }
        );
      }
    }

    await recalculateDonationTotal(id, t);
    const _empAddItem = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(id, _empAddItem, "ADD_ITEM", { itemId: item.donationItemId }, t);

    await t.commit();
    res.status(201).json({ success: true, message: "Item added", data: item });
  } catch (error) {
    await t.rollback();
    console.error("Add item error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE DONATION ITEM (draft only)
// ------------------------------------------------------------------
exports.updateDonationItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { quantity, unitValue, description, paymentMethod, beneficiaryId, distributionDate } = req.body;

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ["status"] }],
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (item.Donation.status !== "draft") {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Donation is not editable" });
    }

    const updates = {};
    if (quantity !== undefined) updates.quantity = quantity;
    if (unitValue !== undefined) updates.unitValue = unitValue;
    if (description !== undefined) updates.description = description;
    if (beneficiaryId !== undefined) updates.beneficiaryId = beneficiaryId;
    if (distributionDate !== undefined) updates.distributionDate = distributionDate;
    
    // Allow updating payment method (only meaningful for money items)
    if (paymentMethod !== undefined) {
      updates.paymentMethod = paymentMethod;
    }

    // Recalculate total if quantity/unitValue changed
    if (quantity !== undefined || unitValue !== undefined) {
      const qty = quantity !== undefined ? parseFloat(quantity) : parseFloat(item.quantity);
      const val = unitValue !== undefined ? parseFloat(unitValue) : parseFloat(item.unitValue);
      updates.totalValue = money(qty * val);
    }

    await item.update(updates, { transaction: t });
    await recalculateDonationTotal(item.donationId, t);
    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(item.donationId, employeeId, "UPDATE_ITEM", { itemId }, t);

    await t.commit();
    res.json({ success: true, message: "Item updated", data: item });
  } catch (error) {
    await t.rollback();
    console.error("Update item error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE DONATION ITEM (draft only)
// ------------------------------------------------------------------
exports.deleteDonationItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ["status", "donationId"] }],
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (item.Donation.status !== "draft") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: "Cannot delete item after submission" });
    }

    const donationId = item.donationId;
    await item.destroy({ transaction: t });
    await recalculateDonationTotal(donationId, t);
    const _empDel = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(
      donationId,
      _empDel,
      "DELETE_ITEM",
      { itemId },
      t,
    );

    await t.commit();
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    await t.rollback();
    console.error("Delete item error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ------------------------------------------------------------------
// SUBMIT FOR APPROVAL (draft → pending)
// ------------------------------------------------------------------
exports.submitForApproval = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const donation = await Donation.findByPk(id, {
      include: [{ model: DonationItem }],
      transaction: t,
    });

    if (!donation) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: "Donation not found" });
    }

    if (donation.status !== "draft") {
      await t.rollback();
      return res
        .status(400)
        .json({
          success: false,
          error: `Cannot submit from status: ${donation.status}`,
        });
    }

    if (!donation.DonationItems || donation.DonationItems.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({
          success: false,
          error: "Donation must have at least one item",
        });
    }

    await donation.update({ status: "pending" }, { transaction: t });

    await DonationApproval.create(
      {
        donationId: id,
        status: "pending",
      },
      { transaction: t },
    );

    const _empSubmit = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(id, _empSubmit, "SUBMIT_FOR_APPROVAL", {}, t);

    await t.commit();

    res.json({
      success: true,
      message: "Donation submitted for approval",
      data: { donationId: id, status: "pending" },
    });
  } catch (error) {
    await t.rollback();
    console.error("Submit error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ------------------------------------------------------------------
// APPROVER requestChanges 
// ------------------------------------------------------------------


exports.requestChanges = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }
    
    const donation = await Donation.findByPk(id, { transaction: t });
    if (!donation) throw new Error('Donation not found');
    if (donation.status !== 'pending') throw new Error('Donation must be pending');

    // Get the actual employee ID linked to the logged-in user
    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    await donation.update({ status: 'draft' }, { transaction: t });
    await DonationApproval.create({
      donationId: id,
      approvedBy: employeeId,   // now using employee ID, not user ID
      status: 'rejected',
      comment: comment.trim(),
    }, { transaction: t });

    await logDonationAction(id, employeeId, 'REQUEST_CHANGES', { comment }, t);

    await t.commit();
    res.json({ success: true, message: 'Changes requested' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};


// ------------------------------------------------------------------
// APPROVE DONATION (pending → approved)
// ------------------------------------------------------------------
exports.approveDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const donation = await Donation.findByPk(id, { transaction: t });
    if (!donation) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: "Donation not found" });
    }

    if (donation.status !== "pending") {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: "Donation is not pending approval" });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    await donation.update({ status: "approved", approvedBy: employeeId }, { transaction: t });

    const approval = await DonationApproval.findOne({
      where: { donationId: id, status: "pending" },
      transaction: t,
    });
    if (approval) {
      await approval.update(
        {
          status: "approved",
          approvedBy: employeeId,
          comment: comment || null,
        },
        { transaction: t },
      );
    } else {
      await DonationApproval.create(
        {
          donationId: id,
          approvedBy: employeeId,
          status: "approved",
          comment,
        },
        { transaction: t },
      );
    }

    await logDonationAction(id, employeeId, "APPROVE", { comment }, t);

    await t.commit();

    res.json({ success: true, message: "Donation approved" });
  } catch (error) {
    await t.rollback();
    console.error("Approve error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DISTRIBUTE DONATION (approved → distributed)
// ------------------------------------------------------------------
exports.distributeDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const donation = await Donation.findByPk(id, {
      include: {
        model: DonationItem,
        include: [ { model: DonationDistributionEvidence, attributes: ['evidenceId'] } ]
      },
      transaction: t
    });

    if (!donation) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    if (donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation must be approved first' });
    }

    // ***** Evidence check for all items *****
    const itemsWithoutEvidence = [];
    for (const item of donation.DonationItems) {
      if (!item.DonationDistributionEvidences || item.DonationDistributionEvidences.length === 0) {
        itemsWithoutEvidence.push(item.description || `Item #${item.donationItemId}`);
      }
    }

    if (itemsWithoutEvidence.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `The following items are missing evidence: ${itemsWithoutEvidence.join(', ')}. Please upload evidence before distribution.`
      });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    // Mark donation as distributed
    await donation.update({ status: 'distributed', distributedBy: employeeId }, { transaction: t });

    // Optionally mark all items as distributed (if we want to be consistent)
    await DonationItem.update(
      { status: 'distributed' },
      { where: { donationId: id }, transaction: t }
    );

    await logDonationAction(id, employeeId, 'DISTRIBUTE', {}, t);

    await t.commit();
    res.json({ success: true, message: 'Donation marked as distributed' });
  } catch (error) {
    await t.rollback();
    console.error('Distribute error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DISTRIBUTE SPECIFIC ITEM TO BENEFICIARY(IES)
// ------------------------------------------------------------------
exports.distributeItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { distributions } = req.body;

    if (
      !distributions ||
      !Array.isArray(distributions) ||
      distributions.length === 0
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: "distributions array required" });
    }

    const item = await DonationItem.findByPk(itemId, {
      include: [
        { model: Donation },
        { model: DonationItemInterval }
      ],
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (!['draft', 'pending', 'approved'].includes(item.Donation.status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot distribute at this donation status' });
    }

    const totalDistQty = distributions.reduce(
      (sum, d) => sum + parseFloat(d.quantity),
      0,
    );
    if (totalDistQty > parseFloat(item.quantity)) {
      await t.rollback();
      return res
        .status(400)
        .json({
          success: false,
          error: "Distribution quantity exceeds item quantity per interval",
        });
    }

    const createdDistributions = [];
    
    // Determine which intervals to target
    let targetIntervalIds = [null];
    if (item.isRecurring) {
      if (!item.DonationItemIntervals || item.DonationItemIntervals.length === 0) {
        // Safety: Try fetching intervals if they weren't included correctly
        const intervals = await DonationItemInterval.findAll({
          where: { donationItemId: itemId },
          transaction: t
        });
        if (intervals.length === 0) {
          await t.rollback();
          return res.status(400).json({ success: false, error: "Recurring item has no intervals defined" });
        }
        targetIntervalIds = intervals.map(inv => inv.intervalId);
      } else {
        targetIntervalIds = item.DonationItemIntervals.map(inv => inv.intervalId);
      }
    }

    for (const intervalId of targetIntervalIds) {
      for (const dist of distributions) {
        const beneficiary = await Beneficiary.findByPk(dist.beneficiaryId, {
          transaction: t,
        });
        if (!beneficiary) {
          await t.rollback();
          return res.status(404).json({
            success: false,
            error: `Beneficiary ${dist.beneficiaryId} not found`,
          });
        }

        // Allow paymentMethod to vary per beneficiary/item if provided
        const pm = dist.paymentMethod || item.paymentMethod || 'bank';

        const value = money(parseFloat(dist.quantity) * parseFloat(item.unitValue));
        const distribution = await DonationDistribution.create(
          {
            donationItemId: itemId,
            intervalId: intervalId, // Will be null for non-recurring, and specific ID for recurring
            beneficiaryId: dist.beneficiaryId,
            quantity: dist.quantity,
            value,
            // paymentMethod is currently on DonationItem, but if we need it on DonationDistribution:
            // pm
          },
          { transaction: t },
        );
        
        // If we want to update the item's paymentMethod for this specific beneficiary link (v3)
        if (item.beneficiaryId === dist.beneficiaryId) {
            await item.update({ paymentMethod: pm }, { transaction: t });
        }

        createdDistributions.push(distribution);
      }
    }

    const _empDistItem = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(
      item.Donation.donationId,
      _empDistItem,
      "DISTRIBUTE_ITEM",
      {
        itemId,
        distributions: distributions.length,
      },
      t,
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Item distributed",
      data: createdDistributions,
    });
  } catch (error) {
    await t.rollback();
    console.error("Distribute item error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDistributionDate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { distributionDate } = req.body;

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ['status'] }],
      transaction: t
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (item.Donation.status === 'distributed') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot update date for distributed donation' });
    }

    await item.update({ distributionDate }, { transaction: t });

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(item.donationId, employeeId, 'UPDATE_DISTRIBUTION_DATE', { itemId, distributionDate }, t);

    await t.commit();
    res.json({ success: true, message: 'Distribution date updated', data: item });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.deleteItemDistributions = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ['status'] }],
      transaction: t
    });

    if (!item || item.Donation.status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Item can only be modified when donation is draft' });
    }

    await DonationDistribution.destroy({ where: { donationItemId: itemId }, transaction: t });

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(item.donationId, employeeId, 'DELETE_ITEM_DISTRIBUTIONS', { itemId }, t);

    await t.commit();
    res.json({ success: true, message: 'Distributions cleared for item' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadEvidence = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params; // now itemId, not distributionId
    const files = req.files;

    if (!files || files.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ['donationId', 'status'] }],
      transaction: t
    });
    if (!item || item.Donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation must be approved' });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    const evidences = [];
    for (const file of files) {
      const evidence = await DonationDistributionEvidence.create({
        donationItemId: parseInt(itemId),
        fileUrl: `/uploads/documents/charityEvidences/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedBy: employeeId,
      }, { transaction: t });
      evidences.push(evidence);
    }

    await logDonationAction(item.Donation.donationId, employeeId, 'EVIDENCE_UPLOADED', {
      itemId,
      fileCount: files.length,
    }, t);

    await t.commit();
    res.json({ success: true, message: `${evidences.length} evidence(s) uploaded`, data: evidences });
  } catch (error) {
    await t.rollback();
    console.error('Upload evidence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.markItemDistributed = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;

    // Fetch item with its donation and existing evidence count
    const item = await DonationItem.findByPk(itemId, {
      include: [
        { model: Donation, attributes: ['donationId', 'status'] },
        { model: DonationDistributionEvidence, attributes: ['evidenceId'] } // just to check existence
      ],
      transaction: t
    });

    if (!item || item.Donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation must be approved' });
    }

    if (item.status === 'distributed') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Item already distributed' });
    }

    // ***** Evidence check *****
    if (!item.DonationDistributionEvidences || item.DonationDistributionEvidences.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No evidence uploaded for item "${item.description}". Please upload evidence before distribution.`
      });
    }

    // Mark item as distributed
    await item.update({ status: 'distributed' }, { transaction: t });

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await logDonationAction(item.Donation.donationId, employeeId, 'ITEM_DISTRIBUTED', {
      itemId,
      itemDescription: item.description,
    }, t);

    // If all items are distributed, auto-mark donation as distributed
    const allItems = await DonationItem.findAll({
      where: { donationId: item.donationId },
      transaction: t
    });
    const allDistributed = allItems.every(i => i.status === 'distributed');
    if (allDistributed) {
      await Donation.update(
        { status: 'distributed', distributedBy: employeeId },
        { where: { donationId: item.donationId }, transaction: t }
      );
      await logDonationAction(item.donationId, employeeId, 'DISTRIBUTE', {}, t);
    }

    await t.commit();
    res.json({ success: true, message: 'Item marked as distributed' });
  } catch (error) {
    await t.rollback();
    console.error('Mark item distributed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ------------------------------------------------------------------
// GET DISTRIBUTIONS LIST
// ------------------------------------------------------------------
exports.getDistributions = async (req, res) => {
  try {
    const { page = 1, size = 10, beneficiaryId, donationId } = req.query;
    const { limit, offset } = getPagination(page, size);

    const where = {};
    if (beneficiaryId) where.beneficiaryId = parseInt(beneficiaryId);

    const include = [
      {
        model: DonationItem,
        include: [
          {
            model: Donation,
            attributes: ["donationId", "donationDate"],
            where: donationId
              ? { donationId: parseInt(donationId) }
              : undefined,
          },
        ],
      },
      { model: Beneficiary, attributes: ["beneficiaryId", "name", "type"] },
    ];

    const { count, rows } = await DonationDistribution.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get distributions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET DISTRIBUTION BY ID
// ------------------------------------------------------------------
exports.getDistributionById = async (req, res) => {
  try {
    const { distributionId } = req.params;

    const distribution = await DonationDistribution.findByPk(distributionId, {
      include: [
        {
          model: DonationItem,
          include: [
            {
              model: Donation,
              include: [{ model: DonationCompany }, { model: Campaign }],
            },
          ],
        },
        { model: Beneficiary },
      ],
    });

    if (!distribution) {
      return res
        .status(404)
        .json({ success: false, error: "Distribution not found" });
    }

    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error("Get distribution error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET APPROVAL HISTORY FOR A DONATION
// ------------------------------------------------------------------
exports.getApprovalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const approvals = await DonationApproval.findAll({
      where: { donationId: id },
      include: [
        {
          model: Employee,
          attributes: ["employeeId", "firstName", "lastName"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error("Get approval history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET LOGS FOR A DONATION
// ------------------------------------------------------------------
exports.getDonationLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, size = 20 } = req.query;
    const { limit, offset } = getPagination(page, size);

    const { count, rows } = await DonationLog.findAndCountAll({
      where: { donationId: id },
      include: [
        {
          model: Employee,
          attributes: ["employeeId", "firstName", "lastName"],
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get donation logs error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DONATIONS BY CAMPAIGN
// ------------------------------------------------------------------
exports.getDonationsByCampaign = async (req, res) => {
  try {
    const stats = await Donation.findAll({
      attributes: [
        'campaignId',
        [sequelize.fn('COUNT', sequelize.col('donation_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_value')), 'total']
      ],
      include: [{ model: Campaign, attributes: ['title'] }],
      where: { status: { [Op.ne]: 'cancelled' } },
      group: ['campaignId', 'Campaign.campaignId', 'Campaign.title'],
      order: [[sequelize.fn('SUM', sequelize.col('total_value')), 'DESC']]
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Donations by campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DONATIONS BY COMPANY
// ------------------------------------------------------------------
exports.getDonationsByCompany = async (req, res) => {
  try {
    const stats = await Donation.findAll({
      attributes: [
        'companyId',
        [sequelize.fn('COUNT', sequelize.col('donation_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_value')), 'total']
      ],
      include: [{ model: DonationCompany, attributes: ['name', 'type'] }],
      where: { status: { [Op.ne]: 'cancelled' } },
      group: ['companyId', 'DonationCompany.companyId', 'DonationCompany.name', 'DonationCompany.type'],
      order: [[sequelize.fn('SUM', sequelize.col('total_value')), 'DESC']]
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Donations by DonationCompany error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// Add deduction to money item
exports.addDeduction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { amount, reason, reassignedToBeneficiaryId } = req.body;
    const item = await DonationItem.findByPk(itemId, { transaction: t });
    if (!item) throw new Error('Item not found');
    if (item.type !== 'money') throw new Error('Only money items can have deductions');
    const deduction = await DonationDeduction.create({
      donationItemId: itemId,
      amount,
      reason,
      reassignedToBeneficiaryId,
      createdBy: req.user.userId
    }, { transaction: t });
    if (!reassignedToBeneficiaryId) {
      item.unassignedDeduction = parseFloat(item.unassignedDeduction || 0) + parseFloat(amount);
      await item.save({ transaction: t });
    }
    await t.commit();
    res.status(201).json({ success: true, data: deduction });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get deductions for an item
exports.getItemDeductions = async (req, res) => {
  try {
    const deductions = await DonationDeduction.findAll({
      where: { donationItemId: req.params.itemId },
      include: [
        { model: Beneficiary, as: 'reassignedTo', attributes: ['name'] },
        { model: Employee, attributes: ['firstName', 'lastName'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: deductions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Return a distribution
exports.returnDistribution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { distributionId } = req.params;
    const { reason } = req.body;

    const distribution = await DonationDistribution.findByPk(distributionId, {
      include: [{ model: DonationItem, attributes: ['donationId'] }],
      transaction: t
    });

    if (!distribution) throw new Error('Distribution not found');
    if (distribution.isReturned) throw new Error('Already returned');

    distribution.isReturned = true;
    distribution.returnReason = reason;
    distribution.returnedAt = new Date();
    await distribution.save({ transaction: t });

    // Recalculate donation total (subtracts returned value)
    await recalculateDonationTotal(distribution.DonationItem.donationId, t);

    await t.commit();
    res.json({ success: true, message: 'Distribution returned' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DONATION STATS SUMMARY
// ------------------------------------------------------------------
exports.getDonationStats = async (req, res) => {
  try {
    const { groupId } = req.query;
    let effectiveGroupId = groupId;

    // Auto-filter for team leaders if not explicitly provided (or even if it is)
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
      
      if (groupId) {
        if (!involvedGroupIds.includes(parseInt(groupId))) {
          effectiveGroupId = -1; // No access to requested group
        }
      } else {
        effectiveGroupId = involvedGroupIds.length ? { [Op.in]: involvedGroupIds } : -1;
      }
    }

    const whereDonation = {};
    if (effectiveGroupId) whereDonation.groupId = effectiveGroupId;

    const totalDonations = await Donation.count({ where: whereDonation });

    // Net total value (already subtracts returns, excludes cancelled)
    const totalValue = await Donation.sum('total_value', {
      where: { ...whereDonation, status: { [Op.notIn]: ['cancelled'] } }
    }) || 0;

    // Total returned value (across all donations)
    const returnedValue = await DonationDistribution.sum('value', {
      where: { isReturned: true },
      include: [{
        model: DonationItem,
        include: [{
          model: Donation,
          where: whereDonation
        }]
      }]
    }) || 0;

    // Total value of cancelled donations
    const cancelledValue = await Donation.sum('total_value', {
      where: { ...whereDonation, status: 'cancelled' }
    }) || 0;

    // Gross distributed value (before returns)
    const grossValue = money(money(totalValue) + money(returnedValue));

    // Status counts
    const statusCounts = await Donation.findAll({
      where: whereDonation,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('donation_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Value by type
    const byType = await DonationItem.findAll({
      include: [{
        model: Donation,
        where: whereDonation,
        attributes: []
      }],
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('DonationItem.total_value')), 'total']
      ],
      group: ['type'],
      raw: true
    });

    const recentDonations = await Donation.findAll({
      where: whereDonation,
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: DonationCompany, attributes: ['name'] }]
    });

    res.json({
      success: true,
      data: {
        totalDonations,
        totalValue,            // net distributed
        grossValue,            // distributed before returns
        returnedValue,         // total returned
        cancelledValue,        // total cancelled
        statusBreakdown: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.dataValues?.count ?? curr.count);
          return acc;
        }, {}),
        valueByType: byType.reduce((acc, curr) => {
          acc[curr.type] = parseFloat(curr.dataValues?.total ?? curr.total);
          return acc;
        }, {}),
        recentDonations
      }
    });
  } catch (error) {
    console.error('Donation stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.distributeItemForInterval = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId, intervalId } = req.params;
    const { distributions } = req.body; // array of { beneficiaryId, quantity, value }

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: DonationItemInterval, where: { intervalId }, required: true }, { model: Donation, attributes: ['status'] }],
      transaction: t
    });

    if (!item || item.Donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Item not found or donation not approved' });
    }

    const interval = item.DonationItemIntervals[0];
    if (!interval) throw new Error('Interval not found');

    // ***** NEW: Evidence check for this specific interval *****
    const evidenceCount = await DonationDistributionEvidence.count({
      where: { intervalId },
      transaction: t
    });

    if (evidenceCount === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No evidence uploaded for this period. Please upload evidence before distribution.`
      });
    }

    // Check date: must be within interval and not already distributed
    const existingDistributions = await DonationDistribution.count({
      where: { intervalId },
      transaction: t
    });

    if (existingDistributions > 0 && (!distributions || distributions.length === 0)) {
      // Just mark as distributed since distributions are already pre-assigned
      await interval.update({ status: 'distributed' }, { transaction: t });
      await t.commit();
      return res.json({ success: true, message: 'Interval marked as distributed' });
    }

    if (existingDistributions > 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'This interval has already been distributed' });
    }

    if (!distributions || distributions.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'No distributions provided' });
    }

    // Validate total quantity
    const totalQty = distributions.reduce((sum, d) => sum + parseFloat(d.quantity || 0), 0);
    if (totalQty > parseFloat(item.quantity)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: `Total quantity (${totalQty}) exceeds the allowed quantity per interval (${item.quantity})` 
      });
    }

    const created = [];
    for (const dist of distributions) {
      const beneficiary = await Beneficiary.findByPk(dist.beneficiaryId, { transaction: t });
      if (!beneficiary) throw new Error(`Beneficiary ${dist.beneficiaryId} not found`);
      const value = money(parseFloat(dist.quantity) * parseFloat(item.unitValue));
      const distribution = await DonationDistribution.create({
        donationItemId: itemId,
        beneficiaryId: dist.beneficiaryId,
        quantity: dist.quantity,
        value,
        intervalId,
      }, { transaction: t });
      created.push(distribution);
    }

    // Mark interval as distributed
    await interval.update({ status: 'distributed' }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Interval distributed successfully', data: created });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};



exports.uploadIntervalEvidence = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId, intervalId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    // Validate item and interval existence
    const item = await DonationItem.findByPk(itemId, {
      include: [
        { model: Donation, attributes: ['donationId', 'status'] },
        { model: DonationItemInterval, where: { intervalId }, required: true }
      ],
      transaction: t
    });

    if (!item || item.Donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Item not found or donation not approved' });
    }

    const interval = item.DonationItemIntervals[0];
    if (!interval) throw new Error('Interval not found');

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    const evidences = [];
    for (const file of files) {
      const evidence = await DonationDistributionEvidence.create({
        donationItemId: parseInt(itemId),
        intervalId: parseInt(intervalId),
        fileUrl: `/uploads/documents/charityEvidences/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedBy: employeeId,
      }, { transaction: t });
      evidences.push(evidence);
    }

    // Mark interval as pending (evidence uploaded)
    await interval.update({ status: 'pending' }, { transaction: t });

    await logDonationAction(item.Donation.donationId, employeeId, 'EVIDENCE_UPLOADED_INTERVAL', {
      itemId,
      intervalId,
      fileCount: files.length,
    }, t);

    await t.commit();
    res.json({ success: true, message: `${evidences.length} evidence(s) uploaded`, data: evidences });
  } catch (error) {
    await t.rollback();
    console.error('Upload interval evidence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.updateDonationItemInterval = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { interval } = req.body;

    const item = await DonationItem.findByPk(itemId, {
      include: [{ model: Donation, attributes: ['status'] }],
      transaction: t
    });
    if (!item || item.Donation.status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Item not editable' });
    }

    // Remove old intervals
    await DonationItemInterval.destroy({ where: { donationItemId: itemId }, transaction: t });

    if (interval) {
      if (!interval.intervalType || !interval.intervalCount || !interval.startDate) {
        throw new Error('Invalid interval data');
      }
      const count = parseInt(interval.intervalCount);
      
      for (let i = 0; i < count; i++) {
        let start = new Date(interval.startDate);
        let end = new Date(interval.startDate);

        if (interval.intervalType === "daily") {
          start.setDate(start.getDate() + i);
          end.setDate(end.getDate() + i);
        } else if (interval.intervalType === "weekly") {
          start.setDate(start.getDate() + i * 7);
          end.setDate(end.getDate() + (i + 1) * 7 - 1);
        } else if (interval.intervalType === "monthly") {
          start.setMonth(start.getMonth() + i);
          end.setMonth(end.getMonth() + i + 1);
          end.setDate(end.getDate() - 1);
        }

        await DonationItemInterval.create({
          donationItemId: itemId,
          intervalType: interval.intervalType,
          intervalCount: i + 1,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          status: 'pending',
        }, { transaction: t });
      }
    }

    // Update item's isRecurring flag
    await item.update({ isRecurring: !!interval }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Interval updated' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

// Reassign or deduct from a distribution
exports.reassignDistribution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { distributionId } = req.params;
    const { amount, toBeneficiaryId, reason } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Valid amount is required');
    }

    const dist = await DonationDistribution.findByPk(distributionId, {
      include: [
        { 
          model: DonationItem, 
          include: [
            { model: Donation, attributes: ['status', 'donationId'] },
            { model: DonationItemInterval, as: 'DonationItemIntervals' }
          ] 
        }
      ],
      transaction: t
    });

    if (!dist) throw new Error('Distribution not found');
    
    const item = dist.DonationItem;
    if (item.Donation.status !== 'approved') {
      throw new Error('Reassignment only allowed for approved donations');
    }

    // Check if item itself is distributed
    if (item.status === 'distributed') {
      throw new Error('Cannot reassign/deduct from an already distributed item');
    }

    // Check if the specific interval is distributed
    if (dist.intervalId && item.DonationItemIntervals) {
      const interval = item.DonationItemIntervals.find(i => i.intervalId === dist.intervalId);
      if (interval && interval.status === 'distributed') {
        throw new Error('Cannot reassign/deduct from an already distributed period');
      }
    }

    if (parseFloat(amount) > parseFloat(dist.quantity)) {
      throw new Error('Deduction amount exceeds distribution quantity');
    }

    // 1. Decrease source distribution
    const oldQty = parseFloat(dist.quantity);
    const newQty = oldQty - parseFloat(amount);
    
    // Update distribution
    dist.quantity = newQty;
    dist.value = money(newQty * money(item.unitValue));
    
    if (newQty <= 0) {
      await dist.destroy({ transaction: t });
    } else {
      await dist.save({ transaction: t });
    }

    // 2. Handle reassignment
    if (toBeneficiaryId) {
      // Prevent reassignment to a beneficiary that already returned this item
      const returnedDist = await DonationDistribution.findOne({
        where: {
          donationItemId: item.donationItemId,
          beneficiaryId: toBeneficiaryId,
          intervalId: dist.intervalId,
          isReturned: true
        },
        transaction: t
      });

      if (returnedDist) {
        throw new Error('Cannot reassign to a beneficiary that has already returned this item/period');
      }

      // Find or create target distribution
      let targetDist = await DonationDistribution.findOne({
        where: {
          donationItemId: item.donationItemId,
          beneficiaryId: toBeneficiaryId,
          intervalId: dist.intervalId,
          isReturned: false // Only merge with active distributions
        },
        transaction: t
      });

      if (targetDist) {
        targetDist.quantity = money(parseFloat(targetDist.quantity) + money(amount));
        targetDist.value = money(targetDist.quantity * money(item.unitValue));
        await targetDist.save({ transaction: t });
      } else {
        await DonationDistribution.create({
          donationItemId: item.donationItemId,
          beneficiaryId: toBeneficiaryId,
          intervalId: dist.intervalId,
          quantity: amount,
          value: money(parseFloat(amount) * money(item.unitValue))
        }, { transaction: t });
      }
    } else {
      // If not reassigned, it goes back to the item's unassigned pool
      const deductedValue = money(parseFloat(amount) * money(item.unitValue));
      item.unassignedDeduction = parseFloat(item.unassignedDeduction || 0) + deductedValue;
      await item.save({ transaction: t });
    }

    // 3. Log the deduction/reassignment
    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    await DonationDeduction.create({
      donationItemId: item.donationItemId,
      distributionId: dist.distributionId,
      intervalId: dist.intervalId || null,
      amount: parseFloat(amount) * parseFloat(item.unitValue), 
      reason,
      fromBeneficiaryId: dist.beneficiaryId,
      reassignedToBeneficiaryId: toBeneficiaryId || null,
      createdBy: employeeId
    }, { transaction: t });

    await logDonationAction(item.Donation.donationId, employeeId, 'REASSIGN_DISTRIBUTION', {
      fromBeneficiaryId: dist.beneficiaryId,
      toBeneficiaryId,
      amount,
      itemId: item.donationItemId
    }, t);

    await t.commit();
    res.json({ success: true, message: 'Distribution reassigned/deducted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Reassign distribution error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};