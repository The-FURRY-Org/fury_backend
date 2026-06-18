const express = require("express");
const { createCompany, getMyCompany, updateCompany, getCompanyCollectors, getCompanyCustomers, getCompanyDashboard, getCollectorLoginEvents, deleteDriver } = require("../controllers/companyController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("manager"));

router.post("/", createCompany);
router.get("/my-company", getMyCompany);
router.put("/:id", updateCompany);
router.get("/dashboard", getCompanyDashboard);
router.get("/collectors", getCompanyCollectors);
router.get("/customers", getCompanyCustomers);
router.get("/collectors/logins", getCollectorLoginEvents);
router.delete("/collectors/:id", deleteDriver);

module.exports = router;
