const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/charity/donationCompanyController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.get("/", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), companyController.getAllCompanies);
router.get("/:id", authMiddleware(['admin', 'charity_admin', 'charity_teamleader']), companyController.getCompanyById);
router.post("/", authMiddleware(['admin', 'charity_admin']), companyController.createCompany);
router.put("/:id", authMiddleware(['admin', 'charity_admin']), companyController.updateCompany);
router.delete("/:id", authMiddleware(['admin', 'charity_admin']), companyController.deleteCompany);

module.exports = router;
