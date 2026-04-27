const express = require('express');
const router = express.Router();
const groupController = require('../../controllers/charity/beneficiaryGroupController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', authMiddleware(), groupController.createGroup);
router.put('/:id', authMiddleware(), groupController.updateGroup);
router.delete('/:id', authMiddleware(), groupController.deleteGroup);
router.post('/:id/assign-manager', authMiddleware(), groupController.assignManager);
module.exports = router;