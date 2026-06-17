const express = require("express");
const { createCompany, getMyCompany, updateCompany } = require("../controllers/companyController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("manager"));

router.post("/", createCompany);
router.get("/my-company", getMyCompany);
router.put("/:id", updateCompany);

module.exports = router;
