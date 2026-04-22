const express = require("express");
const router = express.Router();
const campaignController = require("../../controllers/charity/campaignController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.get("/:id/progress", campaignController.getCampaignProgress);
router.post("/", authMiddleware("admin"), campaignController.createCampaign);
router.put("/:id", authMiddleware("admin"), campaignController.updateCampaign);
router.delete(
  "/:id",
  authMiddleware("admin"),
  campaignController.deleteCampaign,
);
router.post('/:id/extend', authMiddleware('admin'), campaignController.extendCampaign);
router.post('/:id/terminate', authMiddleware('admin'), campaignController.terminateCampaign);
module.exports = router;
