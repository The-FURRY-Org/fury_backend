const pool = require("../config/db");

const createFeedback = async (req, res) => {
  const { pickup_request_id, rating, comment } = req.body;

  if (!pickup_request_id || !rating) {
    return res.status(400).json({ message: "Pickup request and rating are required" });
  }

  const [pickups] = await pool.query(
    "SELECT id FROM pickup_requests WHERE id = ? AND customer_id = ? AND status = 'collected'",
    [pickup_request_id, req.user.id]
  );

  if (!pickups.length) {
    return res.status(403).json({ message: "You can only rate your own completed pickups" });
  }

  const [result] = await pool.query(
    "INSERT INTO pickup_feedback (pickup_request_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)",
    [pickup_request_id, req.user.id, rating, comment || null]
  );

  res.status(201).json({ message: "Feedback saved", id: result.insertId });
};

const getFeedbackByPickup = async (req, res) => {
  const [feedback] = await pool.query(
    `SELECT pf.*, u.full_name AS customer_name
     FROM pickup_feedback pf
     JOIN users u ON u.id = pf.customer_id
     WHERE pf.pickup_request_id = ?`,
    [req.params.pickupId]
  );
  res.json(feedback);
};

module.exports = { createFeedback, getFeedbackByPickup };
