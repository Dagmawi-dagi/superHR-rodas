'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charitySettingController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN = ['admin', 'charity_admin'];

// Get / replace full settings
router.get('/',                    authMiddleware(ADMIN), ctrl.getSettings);
router.put('/',                    authMiddleware(ADMIN), ctrl.updateSettings);

// Company CRUD inside the settings JSON
router.post('/companies',          authMiddleware(ADMIN), ctrl.addCompany);
router.put('/companies/:index',    authMiddleware(ADMIN), ctrl.updateCompany);
router.delete('/companies/:index', authMiddleware(ADMIN), ctrl.deleteCompany);

module.exports = router;
