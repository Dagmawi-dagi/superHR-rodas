const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/charity/donationCompanyController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.use(authMiddleware());

router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);
router.post("/", authMiddleware("admin"), companyController.createCompany);
router.put("/:id", authMiddleware("admin"), companyController.updateCompany);
router.delete("/:id", authMiddleware("admin"), companyController.deleteCompany);

module.exports = router;
