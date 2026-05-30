'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityRequestController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// Stats (before /:id)
router.get('/stats/summary',      authMiddleware(ALL),   ctrl.getRequestStats);

// Adjustment submission (teamleader submits Deduct/Increase/Transfer/Return)
router.post('/adjustment',        authMiddleware(ALL),   ctrl.submitAdjustment);

// List & single
router.get('/',                   authMiddleware(ALL),   ctrl.getRequests);
router.get('/:id',                authMiddleware(ALL),   ctrl.getRequestById);

// Admin review actions
router.post('/:id/approve',       authMiddleware(ADMIN), ctrl.approveRequest);
router.post('/:id/reject',        authMiddleware(ADMIN), ctrl.rejectRequest);
router.post('/:id/comment',       authMiddleware(ADMIN), ctrl.commentRequest);
router.post('/:id/resubmit',      authMiddleware(ALL),   ctrl.resubmitWorkflowRequest); // teamleader can resubmit

module.exports = router;
