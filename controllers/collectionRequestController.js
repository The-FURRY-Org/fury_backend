const pool = require("../config/db");

const createRequest = async (req, res) => {
  try {
    const { location_id, waste_category_id, description, urgency = "normal", estimated_bin_level } = req.body;

    if (!location_id || !waste_category_id || !estimated_bin_level) {
      return res.status(400).json({ message: "Location, waste type, and bin level are required" });
    }

    const [locations] = await pool.query(
      "SELECT id FROM customer_locations WHERE id = ? AND user_id = ?",
      [location_id, req.user.id]
    );

    if (!locations.length) {
      return res.status(403).json({ message: "You can only request collection for your own locations" });
    }

    const photo = req.file ? `/uploads/collection-photos/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO collection_requests
       (client_id, location_id, waste_category_id, description, photo, urgency, estimated_bin_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, location_id, waste_category_id, description || null, photo, urgency, estimated_bin_level]
    );

    res.status(201).json({ message: "Collection request created", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Could not create collection request", error: error.message });
  }
};

const getMyRequests = async (req, res) => {
  const [requests] = await pool.query(
    `SELECT cr.*, wc.name AS waste_type, cl.location_name, cl.district
     FROM collection_requests cr
     JOIN waste_categories wc ON wc.id = cr.waste_category_id
     JOIN customer_locations cl ON cl.id = cr.location_id
     WHERE cr.client_id = ?
     ORDER BY cr.created_at DESC`,
    [req.user.id]
  );
  res.json(requests);
};

const getRequestById = async (req, res) => {
  const params = [req.params.id];
  let ownerClause = "";

  if (req.user.role === "client") {
    ownerClause = "AND cr.client_id = ?";
    params.push(req.user.id);
  } else if (req.user.role === "collector") {
    ownerClause = "AND ca.collector_id = ?";
    params.push(req.user.id);
  }

  const [requests] = await pool.query(
    `SELECT cr.*, wc.name AS waste_type, cl.location_name, cl.district, cl.address_details,
            ca.id AS assignment_id, ca.collector_id, ca.status AS assignment_status,
            ca.collection_notes, ca.cancellation_reason, ca.waste_quantity_collected, ca.proof_photo,
            u.full_name AS collector_name
     FROM collection_requests cr
     JOIN waste_categories wc ON wc.id = cr.waste_category_id
     JOIN customer_locations cl ON cl.id = cr.location_id
     LEFT JOIN collection_assignments ca ON ca.collection_request_id = cr.id
     LEFT JOIN users u ON u.id = ca.collector_id
     WHERE cr.id = ? ${ownerClause}`,
    params
  );

  if (!requests.length) return res.status(404).json({ message: "Collection request not found" });
  res.json(requests[0]);
};

const cancelRequest = async (req, res) => {
  const [result] = await pool.query(
    "UPDATE collection_requests SET status = 'cancelled' WHERE id = ? AND client_id = ? AND status = 'pending'",
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) {
    return res.status(400).json({ message: "Only your pending collection requests can be cancelled" });
  }
  res.json({ message: "Collection request cancelled" });
};

const getPendingRequests = async (req, res) => {
  const [requests] = await pool.query(
    `SELECT cr.*, wc.name AS waste_type, cl.location_name, cl.district, cl.address_details, u.full_name AS client_name
     FROM collection_requests cr
     JOIN waste_categories wc ON wc.id = cr.waste_category_id
     JOIN customer_locations cl ON cl.id = cr.location_id
     JOIN users u ON u.id = cr.client_id
     WHERE cr.status = 'pending'
     ORDER BY FIELD(cr.urgency, 'urgent', 'normal'), cr.created_at ASC`
  );
  res.json(requests);
};

const getAllRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT cr.*, wc.name AS waste_type, cl.location_name, cl.district, u.full_name AS client_name
       FROM collection_requests cr
       JOIN waste_categories wc ON wc.id = cr.waste_category_id
       JOIN customer_locations cl ON cl.id = cr.location_id
       JOIN users u ON u.id = cr.client_id
       ORDER BY cr.created_at DESC`
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch requests", error: error.message });
  }
};

module.exports = { createRequest, getMyRequests, getRequestById, cancelRequest, getPendingRequests, getAllRequests };
