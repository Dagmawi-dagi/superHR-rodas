const { Company, sequelize } = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------------
// GET ALL COMPANIES
// ------------------------------------------------------------------
exports.getAllCompanies = async (req, res) => {
  try {
    const { type, isActive, search } = req.query;
    const where = {};

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const companies = await Company.findAll({
      where,
      order: [["name", "ASC"]],
    });

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET COMPANY BY ID
// ------------------------------------------------------------------
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// CREATE COMPANY
// ------------------------------------------------------------------
exports.createCompany = async (req, res) => {
  try {
    const { name, type, contactInfo } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Company name is required" });
    }

    const company = await Company.create({
      name,
      type: type || "partner",
      contactInfo: contactInfo || {},
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE COMPANY
// ------------------------------------------------------------------
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, contactInfo, isActive } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;
    if (isActive !== undefined) updates.isActive = isActive;

    await company.update(updates);

    res.json({ success: true, message: "Company updated", data: company });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE COMPANY (soft delete)
// ------------------------------------------------------------------
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    await company.update({ isActive: false });

    res.json({ success: true, message: "Company deactivated" });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
