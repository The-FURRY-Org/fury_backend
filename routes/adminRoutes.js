const express = require("express");
const {
  getStats,
  getUsers,
  getPickups,
  getCompanies,
  getTrucks,
  updateUserStatus
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/pickups", getPickups);
router.get("/companies", getCompanies);
router.get("/trucks", getTrucks);
router.put("/users/:id/status", updateUserStatus);

module.exports = router;
