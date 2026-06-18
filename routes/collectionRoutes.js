const express = require("express");
const {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getPendingRequests,
  getAllRequests
} = require("../controllers/collectionRequestController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload, usePickupPhotoFolder } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("client"), usePickupPhotoFolder, upload.single("photo"), createRequest);
router.get("/my-requests", protect, allowRoles("client"), getMyRequests);
router.get("/pending/all", protect, allowRoles("collector", "admin"), getPendingRequests);
router.get("/all", protect, allowRoles("admin"), getAllRequests);
router.get("/:id", protect, allowRoles("client", "collector", "admin"), getRequestById);
router.put("/:id/cancel", protect, allowRoles("client"), cancelRequest);

module.exports = router;
