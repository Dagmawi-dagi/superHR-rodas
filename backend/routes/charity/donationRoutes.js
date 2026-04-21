const express = require("express");
const router = express.Router();
const donationController = require("../../controllers/charity/donationController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

// ------------------------------------------------------------------
// DONATION CRUD
// ------------------------------------------------------------------
router.post("/", donationController.createDonation);
router.get("/", donationController.getAllDonations);
router.get("/:id", donationController.getDonationById);
router.put("/:id", donationController.updateDonation);
router.delete("/:id", donationController.cancelDonation);

// ------------------------------------------------------------------
// DONATION ITEMS
// ------------------------------------------------------------------
router.post("/:id/items", donationController.addDonationItem);
router.put("/items/:itemId", donationController.updateDonationItem);
router.delete("/items/:itemId", donationController.deleteDonationItem);

// ------------------------------------------------------------------
// STATUS TRANSITIONS
// ------------------------------------------------------------------
router.post("/:id/submit", donationController.submitForApproval);
router.post("/:id/approve", donationController.approveDonation);
router.post("/:id/distribute", donationController.distributeDonation);

// ------------------------------------------------------------------
// DISTRIBUTION MANAGEMENT
// ------------------------------------------------------------------
router.post("/items/:itemId/distribute", donationController.distributeItem);
router.get("/distributions", donationController.getDistributions);
router.get(
  "/distributions/:distributionId",
  donationController.getDistributionById,
);

// ------------------------------------------------------------------
// APPROVAL & LOGS
// ------------------------------------------------------------------
router.get("/:id/approvals", donationController.getApprovalHistory);
router.get("/:id/logs", donationController.getDonationLogs);

// ------------------------------------------------------------------
// STATS / REPORTS
// ------------------------------------------------------------------
router.get("/stats/summary", donationController.getDonationStats);
router.get("/stats/by-campaign", donationController.getDonationsByCampaign);
router.get("/stats/by-company", donationController.getDonationsByCompany);

module.exports = router;
