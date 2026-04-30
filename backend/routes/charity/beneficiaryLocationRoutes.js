const express = require("express");
const router = express.Router();
const BeneficiaryLocationController = require("../../controllers/charity/BeneficiaryLocationController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", BeneficiaryLocationController.getAllLocations);
router.get("/:id", BeneficiaryLocationController.getLocationById);
router.post("/", authMiddleware(), BeneficiaryLocationController.createLocation);
router.put("/:id", authMiddleware(), BeneficiaryLocationController.updateLocation);
router.delete(
  "/:id",
  authMiddleware("admin"),
  BeneficiaryLocationController.deleteLocation,
);

module.exports = router;
