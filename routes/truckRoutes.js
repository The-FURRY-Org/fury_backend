const express = require("express");
const { createTruck, getCompanyTrucks, updateTruck, deleteTruck } = require("../controllers/truckController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("manager"));

router.post("/", createTruck);
router.get("/company", getCompanyTrucks);
router.put("/:id", updateTruck);
router.delete("/:id", deleteTruck);

module.exports = router;
