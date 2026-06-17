const pool = require("../config/db");

const getCategories = async (req, res) => {
  const [categories] = await pool.query("SELECT * FROM waste_categories ORDER BY name ASC");
  res.json(categories);
};

const createCategory = async (req, res) => {
  const { name, description, status = "active" } = req.body;
  if (!name) return res.status(400).json({ message: "Category name is required" });

  const [result] = await pool.query(
    "INSERT INTO waste_categories (name, description, status) VALUES (?, ?, ?)",
    [name, description || null, status]
  );

  res.status(201).json({ message: "Waste category created", id: result.insertId });
};

const updateCategory = async (req, res) => {
  const { name, description, status } = req.body;
  const [result] = await pool.query(
    "UPDATE waste_categories SET name = ?, description = ?, status = ? WHERE id = ?",
    [name, description || null, status || "active", req.params.id]
  );

  if (!result.affectedRows) return res.status(404).json({ message: "Category not found" });
  res.json({ message: "Waste category updated" });
};

module.exports = { getCategories, createCategory, updateCategory };
