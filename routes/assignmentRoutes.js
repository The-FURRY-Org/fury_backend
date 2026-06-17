const express = require("express");
const {
  createAssignment,
  getDriverJobs,
  getCompanyJobs,
  updateStatus,
  completeAssignment,
  failAssignment
} = require("../controllers/assignmentController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload, useProofPhotoFolder } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("manager"), createAssignment);
router.get("/driver/my-jobs", protect, allowRoles("driver"), getDriverJobs);
router.get("/company/my-jobs", protect, allowRoles("manager"), getCompanyJobs);
router.put("/:id/status", protect, allowRoles("driver"), updateStatus);
router.put("/:id/complete", protect, allowRoles("driver"), useProofPhotoFolder, upload.single("proof_photo"), completeAssignment);
router.put("/:id/failed", protect, allowRoles("driver"), failAssignment);

module.exports = router;
