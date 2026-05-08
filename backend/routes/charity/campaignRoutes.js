const express = require("express");
const router = express.Router();
const campaignController = require("../../controllers/charity/campaignController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.get("/:id/progress", campaignController.getCampaignProgress);
router.post("/", campaignController.createCampaign);
router.put("/:id", campaignController.updateCampaign);
router.delete("/:id", campaignController.deleteCampaign);
router.post('/:id/extend', campaignController.extendCampaign);
router.post('/:id/terminate', campaignController.terminateCampaign);
module.exports = router;
