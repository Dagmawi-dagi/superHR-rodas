const express = require("express");
const router = express.Router();
const campaignController = require("../../controllers/charity/campaignController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.get("/:id/progress", campaignController.getCampaignProgress);
router.post("/", authMiddleware(), campaignController.createCampaign);
router.put("/:id", authMiddleware(), campaignController.updateCampaign);
router.delete(
  "/:id",
  authMiddleware(),
  campaignController.deleteCampaign,
);
router.post('/:id/extend', authMiddleware(), campaignController.extendCampaign);
router.post('/:id/terminate', authMiddleware(), campaignController.terminateCampaign);
module.exports = router;
