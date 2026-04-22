const express = require("express");
const router = express.Router();
const beneficiaryController = require("../../controllers/charity/beneficiaryController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", beneficiaryController.getAllBeneficiaries);
router.get("/:id", beneficiaryController.getBeneficiaryById);
router.post(
  "/",
  authMiddleware("admin"),
  beneficiaryController.createBeneficiary,
);
router.put(
  "/:id",
  authMiddleware("admin"),
  beneficiaryController.updateBeneficiary,
);
router.delete(
  "/:id",
  authMiddleware("admin"),
  beneficiaryController.deleteBeneficiary,
);
router.post('/:id/transfer', authMiddleware('admin'), beneficiaryController.transferBeneficiary);
router.get('/:id/transfers', beneficiaryController.getTransferHistory);
module.exports = router;
