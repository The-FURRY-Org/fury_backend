const pool = require("../config/db");

const createCompany = async (req, res) => {
  try {
    const { company_name, phone, email, district, address } = req.body;

    if (!company_name || !district) {
      return res.status(400).json({ message: "Company name and district are required" });
    }

    const [existing] = await pool.query("SELECT id FROM waste_companies WHERE manager_id = ?", [req.user.id]);
    if (existing.length) {
      return res.status(409).json({ message: "This manager already has a company profile" });
    }

    const [result] = await pool.query(
      "INSERT INTO waste_companies (manager_id, company_name, phone, email, district, address) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, company_name, phone || null, email || null, district, address || null]
    );

    res.status(201).json({ message: "Company profile created", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Could not create company", error: error.message });
  }
};

const getMyCompany = async (req, res) => {
  const [companies] = await pool.query("SELECT * FROM waste_companies WHERE manager_id = ?", [req.user.id]);
  if (!companies.length) return res.status(404).json({ message: "Company profile not found" });
  res.json(companies[0]);
};

const updateCompany = async (req, res) => {
  const { company_name, phone, email, district, address, status } = req.body;
  const [result] = await pool.query(
    `UPDATE waste_companies
     SET company_name = ?, phone = ?, email = ?, district = ?, address = ?, status = COALESCE(?, status)
     WHERE id = ? AND manager_id = ?`,
    [company_name, phone || null, email || null, district, address || null, status || null, req.params.id, req.user.id]
  );

  if (!result.affectedRows) return res.status(404).json({ message: "Company not found" });
  res.json({ message: "Company updated" });
};

module.exports = { createCompany, getMyCompany, updateCompany };
