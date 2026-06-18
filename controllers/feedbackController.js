const pool = require("../config/db");

const createFeedback = async (req, res) => {
  const { collection_request_id, rating, comment } = req.body;

  if (!collection_request_id || !rating) {
    return res.status(400).json({ message: "Collection request and rating are required" });
  }

  const [collections] = await pool.query(
    "SELECT id FROM collection_requests WHERE id = ? AND client_id = ? AND status = 'completed'",
    [collection_request_id, req.user.id]
  );

  if (!collections.length) {
    return res.status(403).json({ message: "You can only rate your own completed collections" });
  }

  const [result] = await pool.query(
    "INSERT INTO collection_feedback (collection_request_id, client_id, rating, comment) VALUES (?, ?, ?, ?)",
    [collection_request_id, req.user.id, rating, comment || null]
  );

  res.status(201).json({ message: "Feedback saved", id: result.insertId });
};

const getFeedbackByRequest = async (req, res) => {
  try {
    const [feedback] = await pool.query(
      `SELECT cf.*, u.full_name AS client_name
       FROM collection_feedback cf
       JOIN users u ON u.id = cf.client_id
       WHERE cf.collection_request_id = ?`,
      [req.params.collectionRequestId]
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch feedback", error: error.message });
  }
};

module.exports = { createFeedback, getFeedbackByRequest };
