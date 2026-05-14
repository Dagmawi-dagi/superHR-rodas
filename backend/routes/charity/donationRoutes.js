const express = require('express');
const router  = express.Router();
const donationController    = require('../../controllers/charity/donationController');
const adjustmentController  = require('../../controllers/charity/adjustmentController');
const { authMiddleware }    = require('../../middleware/authMiddleware');
const { uploadMultipleDocuments } = require('../../middleware/uploadMiddleware');

// ── DONATION CRUD ─────────────────────────────────────────────────────────────
router.post('/',    authMiddleware(['admin', 'charity_teamleader']), donationController.createDonation);   // head/vice creates
router.get('/',     authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),     donationController.getAllDonations);
router.get('/:id',  authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),     donationController.getDonationById);
router.put('/:id',  authMiddleware(['admin', 'charity_teamleader']), donationController.updateDonation);
router.delete('/:id', authMiddleware(['admin', 'charity_admin']), donationController.cancelDonation);

// ── DONATION ITEMS ────────────────────────────────────────────────────────────
router.post('/:id/items',         authMiddleware(['admin', 'charity_teamleader']), donationController.addDonationItem);
router.put('/items/:itemId',      authMiddleware(['admin', 'charity_teamleader']), donationController.updateDonationItem);
router.delete('/items/:itemId',   authMiddleware(['admin', 'charity_admin']), donationController.deleteDonationItem);
router.delete('/items/:itemId/distributions', authMiddleware(['admin', 'charity_admin']), donationController.deleteItemDistributions);

// ── DISTRIBUTION DATE EDIT (charity_admin only) ───────────────────────────────
router.put('/items/:itemId/distribution-date', authMiddleware(['admin', 'charity_admin']), donationController.updateDistributionDate);

// ── STATUS TRANSITIONS ────────────────────────────────────────────────────────
router.post('/:id/submit',          authMiddleware(['admin', 'charity_teamleader']), donationController.submitForApproval);
router.post('/:id/approve',         authMiddleware(['admin', 'charity_admin']),      donationController.approveDonation);
router.post('/:id/request-changes', authMiddleware(['admin', 'charity_admin']),      donationController.requestChanges);
router.post('/:id/distribute',      authMiddleware(['admin', 'charity_admin']),      donationController.distributeDonation);

// ── DISTRIBUTION MANAGEMENT ───────────────────────────────────────────────────
router.post('/items/:itemId/distribute',           authMiddleware(['admin', 'charity_admin']), donationController.distributeItem);
router.post('/items/:itemId/distribute-single',    authMiddleware(['admin', 'charity_admin']), donationController.markItemDistributed);
router.post('/items/:itemId/distribute/:intervalId', authMiddleware(['admin', 'charity_admin']), donationController.distributeItemForInterval);
router.get('/distributions',                       authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDistributions);
router.get('/distributions/:distributionId',       authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDistributionById);
router.post('/distributions/:distributionId/return',   authMiddleware(['admin', 'charity_admin']), donationController.returnDistribution);
router.post('/distributions/:distributionId/reassign', authMiddleware(['admin', 'charity_admin']), donationController.reassignDistribution);

// ── ADJUSTMENT REQUESTS ───────────────────────────────────────────────────────
router.post('/items/:itemId/adjustments',        authMiddleware(['admin', 'charity_teamleader']), adjustmentController.requestAdjustment);
router.get('/items/:itemId/adjustments',         authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),     adjustmentController.getItemAdjustments);
router.get('/adjustments/pending',               authMiddleware(['admin', 'charity_admin']),      adjustmentController.getAllPendingAdjustments);
router.put('/adjustments/:id/review',            authMiddleware(['admin', 'charity_admin']),      adjustmentController.reviewAdjustment);

// ── EVIDENCE ──────────────────────────────────────────────────────────────────
router.post('/:id/evidences',
  authMiddleware(['admin', 'charity_admin']),
  (req, res, next) => { req.params.type = 'charityEvidences'; next(); },
  uploadMultipleDocuments,
  donationController.uploadEvidence
);
router.post('/:id/intervals/:intervalId/evidences',
  authMiddleware(['admin', 'charity_admin']),
  (req, res, next) => { req.params.type = 'charityEvidences'; next(); },
  uploadMultipleDocuments,
  donationController.uploadIntervalEvidence
);
router.put('/items/:itemId/interval', authMiddleware(['admin', 'charity_admin']), donationController.updateDonationItemInterval);

// ── APPROVAL & LOGS ────────────────────────────────────────────────────────────
router.get('/:id/approvals', authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getApprovalHistory);
router.get('/:id/logs',      authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDonationLogs);

// ── DEDUCTIONS (legacy — kept for backward compat) ────────────────────────────
router.post('/items/:itemId/deductions', authMiddleware(['admin', 'charity_admin']), donationController.addDeduction);
router.get('/items/:itemId/deductions',  authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getItemDeductions);

// ── STATS ──────────────────────────────────────────────────────────────────────
router.get('/stats/summary',     authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDonationStats);
router.get('/stats/by-campaign', authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDonationsByCampaign);
router.get('/stats/by-company',  authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), donationController.getDonationsByCompany);

module.exports = router;