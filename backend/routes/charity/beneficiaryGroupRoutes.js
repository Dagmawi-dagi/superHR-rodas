const express = require('express');
const router = express.Router();
const groupController = require('../../controllers/charity/beneficiaryGroupController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', authMiddleware('admin'), groupController.createGroup);
router.put('/:id', authMiddleware('admin'), groupController.updateGroup);
router.delete('/:id', authMiddleware('admin'), groupController.deleteGroup);
router.post('/:id/assign-manager', authMiddleware('admin'), groupController.assignManager);
module.exports = router;