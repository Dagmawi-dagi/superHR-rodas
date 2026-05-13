const express = require("express");
const router = express.Router();
const campaignController = require("../../controllers/charity/campaignController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.get("/", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), campaignController.getAllCampaigns);
router.get("/:id", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), campaignController.getCampaignById);
router.get("/:id/progress", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), campaignController.getCampaignProgress);
router.post("/", authMiddleware(['admin', 'charity_admin']), campaignController.createCampaign);
router.put("/:id", authMiddleware(['admin', 'charity_admin']), campaignController.updateCampaign);
router.delete("/:id", authMiddleware(['admin', 'charity_admin']), campaignController.deleteCampaign);
router.post('/:id/extend', authMiddleware(['admin', 'charity_admin']), campaignController.extendCampaign);
router.post('/:id/terminate', authMiddleware(['admin', 'charity_admin']), campaignController.terminateCampaign);

module.exports = router;
