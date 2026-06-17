const express = require("express");
const { createFeedback, getFeedbackByPickup } = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("customer"), createFeedback);
router.get("/pickup/:pickupId", protect, getFeedbackByPickup);

module.exports = router;
