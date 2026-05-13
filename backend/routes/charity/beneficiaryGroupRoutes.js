const express    = require('express');
const router     = express.Router();
const ctrl       = require('../../controllers/charity/beneficiaryGroupController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/',                 authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),  ctrl.getAllGroups);
router.get('/my-group',         authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),  ctrl.getMyGroup);           // teamleader
router.get('/:id',              authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),  ctrl.getGroupById);
router.get('/:id/beneficiaries',authMiddleware(['admin', 'charity_admin', 'charity_teamleader']),  ctrl.getGroupBeneficiaries); // "beneficiaries icon"
router.post('/',                authMiddleware(['admin', 'charity_admin']),   ctrl.createGroup);
router.put('/:id',              authMiddleware(['admin', 'charity_admin']),   ctrl.updateGroup);
router.delete('/:id',           authMiddleware(['admin', 'charity_admin']),   ctrl.deleteGroup);

module.exports = router;