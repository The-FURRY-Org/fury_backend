const express = require("express");
const { getCategories, createCategory, updateCategory } = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getCategories);
router.post("/", protect, allowRoles("admin"), createCategory);
router.put("/:id", protect, allowRoles("admin"), updateCategory);

module.exports = router;
