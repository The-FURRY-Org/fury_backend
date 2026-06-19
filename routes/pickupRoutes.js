const express = require("express");
const {
  createRequest: createPickup,
  getMyRequests,
  getRequestById: getPickupById,
  cancelRequest: cancelPickup,
  getPendingRequests: getPendingPickups
} = require("../controllers/collectionRequestController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload, usePickupPhotoFolder } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("client"), usePickupPhotoFolder, upload.single("photo"), createPickup);
router.get("/my-requests", protect, allowRoles("client"), getMyRequests);
router.get("/pending/all", protect, allowRoles("manager", "admin"), getPendingPickups);
router.get("/:id", protect, allowRoles("client", "collector", "manager", "admin"), getPickupById);
router.put("/:id/cancel", protect, allowRoles("client"), cancelPickup);

module.exports = router;
