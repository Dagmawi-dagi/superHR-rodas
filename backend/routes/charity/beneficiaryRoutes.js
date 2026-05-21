'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityBeneficiaryController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// Stats (before /:id)
router.get('/stats/summary',  authMiddleware(ALL),   ctrl.getBeneficiaryStats);

// CRUD
router.get('/',               authMiddleware(ALL),   ctrl.getBeneficiaries);
router.get('/:id',            authMiddleware(ALL),   ctrl.getBeneficiaryById);
router.post('/',              authMiddleware(ALL),   ctrl.createBeneficiary);   // teamleader → creates approval request
router.put('/:id',            authMiddleware(ADMIN), ctrl.updateBeneficiary);
router.delete('/:id',         authMiddleware(ADMIN), ctrl.deactivateBeneficiary);  // is_active: false

module.exports = router;
