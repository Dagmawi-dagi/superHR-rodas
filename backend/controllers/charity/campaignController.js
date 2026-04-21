const { Campaign, Donation, Employee, sequelize } = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------------
// GET ALL CAMPAIGNS
// ------------------------------------------------------------------
exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const campaigns = await Campaign.findAll({
      where,
      include: [
        {
          model: Employee,
          attributes: ["employeeId", "firstName", "lastName"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
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
    const { title, description, category, startDate, endDate, targetAmount } =
      req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, error: "Campaign title is required" });
    }

    const campaign = await Campaign.create({
      title,
      description,
      category,
      startDate,
      endDate,
      targetAmount,
      status: "planned",
      createdBy: req.user.userId,
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
      targetAmount,
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
    if (targetAmount !== undefined) updates.targetAmount = targetAmount;
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

    const percentage =
      campaign.targetAmount > 0
        ? (parseFloat(donationsTotal) / parseFloat(campaign.targetAmount)) * 100
        : 0;

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        title: campaign.title,
        targetAmount: campaign.targetAmount,
        raisedAmount: donationsTotal,
        percentage: Math.round(percentage * 100) / 100,
        status: campaign.status,
      },
    });
  } catch (error) {
    console.error("Campaign progress error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
