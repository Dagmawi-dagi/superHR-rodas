const { DonationCompany, sequelize } = require("../../models");
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


// ------------------------------------------------------------------
// GET ALL COMPANIES
// ------------------------------------------------------------------
exports.getAllCompanies = async (req, res) => {
  try {
    const { page, size, sortBy, sortOrder, type, isActive, search } = req.query;
    const { limit, offset } = getPagination(page, size);
    const where = {};

    // Filters
    if (type && type.trim() !== '') {
      where.type = type;
    }
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    if (search && search.trim() !== '') {
      where.name = { [Op.like]: `%${search.trim()}%` };
    }

    const allowedSortFields = ['name', 'type', 'created_at'];
    const order = buildSortingOptions(sortBy, sortOrder, allowedSortFields);

    const { count, rows: companies } = await DonationCompany.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
    });

    res.json({
      success: true,
      data: companies,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page) || 1,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Get DonationCompany error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET COMPANY BY ID
// ------------------------------------------------------------------
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await DonationCompany.findByPk(id);

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

    const company = await DonationCompany.create({
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
    const company = await DonationCompany.findByPk(id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.contactInfo !== undefined) updates.contactInfo = req.body.contactInfo;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    await company.update(updates);   // ✅ instance update – no separate where needed

    res.json({ success: true, message: 'Company updated', data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE COMPANY (soft delete)
// ------------------------------------------------------------------
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await DonationCompany.findByPk(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    await DonationCompany.update({ isActive: false });

    res.json({ success: true, message: "Company deactivated" });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
