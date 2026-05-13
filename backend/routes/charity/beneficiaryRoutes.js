const express = require("express");
const router = express.Router();
const beneficiaryController = require("../../controllers/charity/beneficiaryController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.get("/", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), beneficiaryController.getAllBeneficiaries);
router.get("/:id", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), beneficiaryController.getBeneficiaryById);
router.post("/", authMiddleware(['admin', 'charity_admin']), beneficiaryController.createBeneficiary);
router.put( "/:id", authMiddleware(['admin', 'charity_admin']), beneficiaryController.updateBeneficiary);
router.delete("/:id", authMiddleware(['admin', 'charity_admin']), beneficiaryController.deleteBeneficiary);
router.post('/:id/transfer', authMiddleware(['admin', 'charity_admin']), beneficiaryController.transferBeneficiary);
router.get('/:id/transfers', authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), beneficiaryController.getTransferHistory);

module.exports = router;