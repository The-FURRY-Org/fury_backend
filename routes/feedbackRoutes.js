const express = require("express");
const { createFeedback, getFeedbackByRequest, createGeneralFeedback } = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("client"), createFeedback);
router.post("/general", protect, allowRoles("client", "collector"), createGeneralFeedback);
router.get("/request/:collectionRequestId", protect, getFeedbackByRequest);

module.exports = router;
