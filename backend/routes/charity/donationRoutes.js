'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityDonationController');
const { authMiddleware }          = require('../../middleware/authMiddleware');
const { uploadMultipleDocuments } = require('../../middleware/uploadMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// ── Stats (must come before /:id) ────────────────────────────────────────────
router.get('/stats/summary',           authMiddleware(ALL),   ctrl.getDonationStats);

// ── Donation CRUD ────────────────────────────────────────────────────────────
router.get('/',                         authMiddleware(ALL),   ctrl.getDonations);
router.post('/',                        authMiddleware(ALL),   ctrl.createDonation);      // teamleader auto-scoped to their team
router.get('/:id',                      authMiddleware(ALL),   ctrl.getDonationById);
router.put('/:id',                      authMiddleware(ALL),   ctrl.updateDonation);      // draft only
router.post('/:id/submit',              authMiddleware(ALL),   ctrl.submitDonation);      // draft → pending
router.post('/:id/approve',             authMiddleware(ADMIN), ctrl.approveDonation);     // pending → approved
router.post('/:id/cancel',              authMiddleware(ADMIN), ctrl.cancelDonation);

// ── Donation Items ────────────────────────────────────────────────────────────
router.get('/:id/items',                authMiddleware(ALL),   ctrl.getItems);
router.post('/:id/items',               authMiddleware(ALL),   ctrl.addItem);             // draft only

router.put('/items/:itemId',            authMiddleware(ALL),   ctrl.updateItem);          // draft only
router.delete('/items/:itemId',         authMiddleware(ALL),   ctrl.deleteItem);          // draft only (soft-delete)

router.post('/items/:itemId/deliver',   authMiddleware(ALL),   ctrl.markDelivered);       // approved donation
router.post('/items/:itemId/return',    authMiddleware(ALL),   ctrl.returnItem);          // sets is_returned

router.post(
  '/items/:itemId/receipts',
  authMiddleware(ALL),
  (req, _res, next) => { req.params.type = 'charityEvidences'; next(); },
  uploadMultipleDocuments,
  ctrl.uploadReceipts
);

module.exports = router;
