const express = require("express");
const {
  getAvailableRequests,
  acceptRequest,
  getMyAssignments,
  updateAssignmentStatus,
  completeAssignment,
  cancelAssignment
} = require("../controllers/collectionAssignmentController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload, useProofPhotoFolder } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/available", protect, allowRoles("collector"), getAvailableRequests);
router.post("/accept", protect, allowRoles("collector"), acceptRequest);
router.get("/my-assignments", protect, allowRoles("collector"), getMyAssignments);
router.put("/:id/status", protect, allowRoles("collector"), updateAssignmentStatus);
router.put("/:id/complete", protect, allowRoles("collector"), useProofPhotoFolder, upload.single("proof_photo"), completeAssignment);
router.put("/:id/cancel", protect, allowRoles("collector"), cancelAssignment);

module.exports = router;
