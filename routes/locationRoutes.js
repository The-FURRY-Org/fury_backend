const express = require("express");
const {
  createLocation,
  getMyLocations,
  getLocationById,
  updateLocation,
  deleteLocation
} = require("../controllers/locationController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("client"));

router.post("/", createLocation);
router.get("/my-locations", getMyLocations);
router.get("/:id", getLocationById);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

module.exports = router;
