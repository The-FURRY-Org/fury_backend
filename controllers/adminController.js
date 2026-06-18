const bcrypt = require("bcrypt");
const pool = require("../config/db");

const getStats = async (req, res) => {
  try {
    const [[collectionStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_collection_requests,
        SUM(status = 'pending') AS pending_requests,
        SUM(status = 'completed') AS completed_collections,
        SUM(status = 'cancelled') AS cancelled_requests
       FROM collection_requests`
    );

    const [[collectorStats]] = await pool.query("SELECT COUNT(*) AS active_collectors FROM users WHERE role = 'collector' AND status = 'active'");
    const [[clientStats]] = await pool.query("SELECT COUNT(*) AS active_clients FROM users WHERE role = 'client' AND status = 'active'");
    const [[wasteStats]] = await pool.query(
      `SELECT COALESCE(SUM(waste_quantity_collected), 0) AS waste_collected_this_month
       FROM collection_assignments
       WHERE status = 'completed'
         AND MONTH(completed_at) = MONTH(CURRENT_DATE())
         AND YEAR(completed_at) = YEAR(CURRENT_DATE())`
    );

    res.json({ ...collectionStats, ...collectorStats, ...clientStats, ...wasteStats });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch stats", error: error.message });
  }
};

const getUsers = async (req, res) => {
  const [users] = await pool.query(
    "SELECT id, full_name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC"
  );
  res.json(users);
};

const getCollections = async (req, res) => {
  try {
    const [collections] = await pool.query(
      `SELECT cr.*, u.full_name AS client_name, wc.name AS waste_type, cl.location_name, cl.district
       FROM collection_requests cr
       JOIN users u ON u.id = cr.client_id
       JOIN waste_categories wc ON wc.id = cr.waste_category_id
       JOIN customer_locations cl ON cl.id = cr.location_id
       ORDER BY cr.created_at DESC`
    );
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch collections", error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or inactive" });
  }

  const [result] = await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User status updated" });
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role = "client", status = "active" } = req.body;
    const allowedRoles = ["admin", "client", "collector"];

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "Full name, email, password, and role are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'admin', 'client', or 'collector'" });
    }

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [full_name, email, phone || null, hashedPassword, role, status]
    );

    // Create collector profile if creating as collector
    if (role === "collector") {
      try {
        await pool.query(
          "INSERT INTO collector_profiles (user_id, is_verified) VALUES (?, ?)",
          [result.insertId, false]
        );
      } catch (profileError) {
        console.error("Failed to create collector profile", profileError);
      }
    }

    res.status(201).json({
      message: "User created",
      user: { id: result.insertId, full_name, email, phone, role, status }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create user", error: error.message });
  }
};

const verifyCollector = async (req, res) => {
  try {
    const { collector_id } = req.params;
    const { is_verified } = req.body;

    if (typeof is_verified !== "boolean") {
      return res.status(400).json({ message: "is_verified must be true or false" });
    }

    const [result] = await pool.query(
      "UPDATE collector_profiles SET is_verified = ? WHERE user_id = ?",
      [is_verified, collector_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Collector not found" });
    }

    res.json({ message: `Collector verification status updated to ${is_verified}` });
  } catch (error) {
    res.status(500).json({ message: "Could not verify collector", error: error.message });
  }
};

const getCollectorProfiles = async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT cp.*, u.full_name, u.email, u.phone, u.status
       FROM collector_profiles cp
       JOIN users u ON u.id = cp.user_id
       ORDER BY cp.is_verified DESC, cp.rating DESC`
    );
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch collector profiles", error: error.message });
  }
};

module.exports = { getStats, getUsers, getCollections, updateUserStatus, createUser, verifyCollector, getCollectorProfiles };
