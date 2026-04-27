const express = require("express");
const router = express.Router();
const locationController = require("../../controllers/charity/donationLocationController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", locationController.getAllLocations);
router.get("/:id", locationController.getLocationById);
router.post("/", authMiddleware(), locationController.createLocation);
router.put("/:id", authMiddleware(), locationController.updateLocation);
router.delete(
  "/:id",
  authMiddleware("admin"),
  locationController.deleteLocation,
);

module.exports = router;
