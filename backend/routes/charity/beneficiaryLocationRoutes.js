const express = require("express");
const router = express.Router();
const BeneficiaryLocationController = require("../../controllers/charity/BeneficiaryLocationController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.get("/", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), BeneficiaryLocationController.getAllLocations);
router.get("/:id", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), BeneficiaryLocationController.getLocationById);
router.post("/", authMiddleware(['admin', 'charity_admin']), BeneficiaryLocationController.createLocation);
router.put("/:id", authMiddleware(['admin', 'charity_admin']), BeneficiaryLocationController.updateLocation);
router.delete("/:id", authMiddleware(['admin', 'charity_admin']), BeneficiaryLocationController.deleteLocation);

module.exports = router;