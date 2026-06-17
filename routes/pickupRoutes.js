const express = require("express");
const {
  createPickup,
  getMyRequests,
  getPickupById,
  cancelPickup,
  getPendingPickups
} = require("../controllers/pickupController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload, usePickupPhotoFolder } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("customer"), usePickupPhotoFolder, upload.single("photo"), createPickup);
router.get("/my-requests", protect, allowRoles("customer"), getMyRequests);
router.get("/pending/all", protect, allowRoles("manager", "admin"), getPendingPickups);
router.get("/:id", protect, allowRoles("customer", "driver", "manager", "admin"), getPickupById);
router.put("/:id/cancel", protect, allowRoles("customer"), cancelPickup);

module.exports = router;
