'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityBeneficiaryController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// CRUD
router.get('/',               authMiddleware(ALL),   ctrl.getBeneficiaries);
router.get('/:id',            authMiddleware(ALL),   ctrl.getBeneficiaryById);
router.post('/',              authMiddleware(ALL),   ctrl.createBeneficiary);
router.put('/:id',            authMiddleware(ALL),   ctrl.updateBeneficiary);
router.delete('/:id',         authMiddleware(ADMIN), ctrl.deleteBeneficiary);

// Special Operations
router.post('/:id/transfer',   authMiddleware(ALL),   ctrl.transferBeneficiary);
router.post('/:id/adjustment', authMiddleware(ALL),   ctrl.addAdjustment);
router.post('/:id/delivery',   authMiddleware(ALL),   ctrl.addDelivery);
router.put('/:id/delivery/:deliveryId', authMiddleware(ALL), ctrl.updateDelivery);

module.exports = router;
