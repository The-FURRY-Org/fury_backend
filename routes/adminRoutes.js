const express = require("express");
const {
  getStats,
  getUsers,
  getCollections,
  updateUserStatus,
  createUser,
  verifyCollector,
  getCollectorProfiles
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.get("/stats", getStats);
router.post("/users", createUser);
router.get("/users", getUsers);
router.get("/pickups", getCollections);
router.get("/collections", getCollections);
router.get("/collectors/profiles", getCollectorProfiles);
router.put("/collectors/:collector_id/verify", verifyCollector);
router.put("/users/:id/status", updateUserStatus);

module.exports = router;
