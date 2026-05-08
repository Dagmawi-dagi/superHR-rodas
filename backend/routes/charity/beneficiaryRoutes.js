const express = require("express");
const router = express.Router();
const beneficiaryController = require("../../controllers/charity/beneficiaryController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", beneficiaryController.getAllBeneficiaries);
router.get("/:id", beneficiaryController.getBeneficiaryById);
router.post("/", beneficiaryController.createBeneficiary);
router.put( "/:id",beneficiaryController.updateBeneficiary);
router.delete("/:id",beneficiaryController.deleteBeneficiary);
router.post('/:id/transfer',beneficiaryController.transferBeneficiary);
router.get('/:id/transfers',beneficiaryController.getTransferHistory);
module.exports = router;
