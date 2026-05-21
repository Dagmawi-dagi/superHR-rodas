'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityTeamController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// Stats (before /:id so it's not swallowed)
router.get('/stats/summary',          authMiddleware(ADMIN), ctrl.getTeamStats);

// CRUD
router.get('/',                        authMiddleware(ALL),   ctrl.getTeams);
router.get('/:id',                     authMiddleware(ALL),   ctrl.getTeamById);
router.get('/:id/beneficiaries',       authMiddleware(ALL),   ctrl.getTeamBeneficiaries);
router.post('/',                       authMiddleware(ALL),   ctrl.createTeam);
router.put('/:id',                     authMiddleware(ADMIN), ctrl.updateTeam);
router.delete('/:id',                  authMiddleware(ADMIN), ctrl.deactivateTeam);      // is_active: false + cascade

// Transfer a beneficiary to another team → creates approval request
router.post('/:id/transfer-beneficiary', authMiddleware(ALL), ctrl.transferBeneficiary);

module.exports = router;
