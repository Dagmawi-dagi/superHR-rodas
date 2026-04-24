const { DonationLocation, sequelize } = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------------
// GET ALL LOCATIONS
// ------------------------------------------------------------------
exports.getAllLocations = async (req, res) => {
  try {
    const { region, city, search } = req.query;
    const where = {};

    if (region) where.region = region;
    if (city) where.city = city;
    if (search) {
      where[Op.or] = [
        { region: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { woreda: { [Op.like]: `%${search}%` } },
      ];
    }

    const locations = await DonationLocation.findAll({
      where,
      order: [
        ["region", "ASC"],
        ["city", "ASC"],
      ],
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// GET LOCATION BY ID
// ------------------------------------------------------------------
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await DonationLocation.findByPk(id);
    if (!location) {
      return res
        .status(404)
        .json({ success: false, error: "Location not found" });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// CREATE LOCATION
// ------------------------------------------------------------------
exports.createLocation = async (req, res) => {
  try {
    const { region, city, woreda, description } = req.body;

    if (!region || !city) {
      return res
        .status(400)
        .json({ success: false, error: "Region and city are required" });
    }

    const location = await DonationLocation.create({
      region,
      city,
      woreda,
      description,
    });

    res.status(201).json({
      success: true,
      message: "DonationLocation created",
      data: location,
    });
  } catch (error) {
    console.error("Create DonationLocation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// UPDATE LOCATION
// ------------------------------------------------------------------
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { region, city, woreda, description } = req.body;

    const location = await DonationLocation.findByPk(id);
    if (!location) {
      return res
        .status(404)
        .json({ success: false, error: "DonationLocation not found" });
    }

    const updates = {};
    if (region !== undefined) updates.region = region;
    if (city !== undefined) updates.city = city;
    if (woreda !== undefined) updates.woreda = woreda;
    if (description !== undefined) updates.description = description;

    await location.update(updates);

    res.json({ success: true, message: "Location updated", data: location });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------------------------------------------------------------
// DELETE LOCATION
// ------------------------------------------------------------------
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await DonationLocation.findByPk(id);
    if (!location) {
      return res
        .status(404)
        .json({ success: false, error: "DonationLocation not found" });
    }

    // Consider checking if location is referenced by beneficiaries
    await location.destroy();

    res.json({ success: true, message: "DonationLocation deleted" });
  } catch (error) {
    console.error("Delete DonationLocation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
