const { Campaign, Donation, Employee, sequelize } = require("../../models");
const { Op } = require("sequelize");
// ---------- HELPER ----------
const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

const buildSortingOptions = (sortBy, sortOrder, allowedFields) => {
  const field = allowedFields.includes(sortBy) ? sortBy : allowedFields[0];
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
// GET ALL CAMPAIGNS
// ------------------------------------------------------------------
exports.getAllCampaigns = async (req, res) => {
  try {
    const { page, size, sortBy, sortOrder, status, category, search } = req.query;
    const { limit, offset } = getPagination(page, size);

    // Build filters
    const where = {};
    if (status && status.trim() !== '') {
      where.status = status;
    }
    if (category && category.trim() !== '') {
      where.category = category;
    }
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Allowed sort fields – only columns that exist in the campaigns table
    const allowedSortFields = ['title', 'startDate', 'endDate', 'status', 'category', 'created_at'];
    const order = buildSortingOptions(sortBy, sortOrder, allowedSortFields);

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        { model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }
      ],
      distinct: true,
    });

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page) || 1,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// ------------------------------------------------------------------
// GET CAMPAIGN BY ID
// ------------------------------------------------------------------
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id, {
      include: [
        {
          model: Employee,
          attributes: ["employeeId", "firstName", "lastName"],
        },
      ],
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, error: "Campaign not found" });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error("Get campaign error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// CREATE CAMPAIGN
// ------------------------------------------------------------------
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, category, startDate, endDate } =
      req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, error: "Campaign title is required" });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    const campaign = await Campaign.create({
      title,
      description,
      category,
      startDate,
      endDate,
      status: "inactive",
      createdBy: employeeId,
    });

    res.status(201).json({
      success: true,
      message: "Campaign created",
      data: campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE CAMPAIGN
// ------------------------------------------------------------------
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      startDate,
      endDate,
      status,
    } = req.body;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, error: "Campaign not found" });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (status !== undefined) updates.status = status;

    await campaign.update(updates);

    res.json({ success: true, message: "Campaign updated", data: campaign });
  } catch (error) {
    console.error("Update campaign error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE CAMPAIGN (soft cancel)
// ------------------------------------------------------------------
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, error: "Campaign not found" });
    }

    await campaign.update({ status: "cancelled" });

    res.json({ success: true, message: "Campaign cancelled" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET CAMPAIGN PROGRESS (donations total vs target)
// ------------------------------------------------------------------
exports.getCampaignProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, error: "Campaign not found" });
    }

    const donationsTotal =
      (await Donation.sum("totalValue", {
        where: {
          campaignId: id,
          status: { [Op.ne]: "cancelled" },
        },
      })) || 0;

    const percentage = 0;

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        title: campaign.title,
        raisedAmount: donationsTotal,
        percentage,
        status: campaign.status,
      },
    });
  } catch (error) {
    console.error("Campaign progress error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.extendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, reason } = req.body;
    if (!newEndDate) return res.status(400).json({ success: false, error: 'newEndDate required' });
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    campaign.endDate = newEndDate;
    campaign.extensionReason = reason || null;
    await campaign.save();
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.terminateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    campaign.status = 'cancelled';
    campaign.actualEndDate = new Date();
    campaign.terminationReason = reason || null;
    await campaign.save();
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};