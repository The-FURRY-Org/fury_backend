const express = require("express");
const { getNotifications, markAsRead, sendNotification } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.post("/send", protect, allowRoles("admin"), sendNotification);

module.exports = router;
