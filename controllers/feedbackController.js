const pool = require("../config/db");

const createFeedback = async (req, res) => {
  const { collection_request_id, pickup_request_id, rating, comment } = req.body;
  const targetId = collection_request_id || pickup_request_id;

  if (!targetId || !rating) {
    return res.status(400).json({ message: "Collection request and rating are required" });
  }

  const [collections] = await pool.query(
    "SELECT id FROM collection_requests WHERE id = ? AND client_id = ? AND status = 'completed'",
    [targetId, req.user.id]
  );

  if (!collections.length) {
    return res.status(403).json({ message: "You can only rate your own completed collections" });
  }

  const [result] = await pool.query(
    "INSERT INTO collection_feedback (collection_request_id, client_id, rating, comment) VALUES (?, ?, ?, ?)",
    [targetId, req.user.id, rating, comment || null]
  );

  // Notify all admins about the new feedback (non-blocking)
  try {
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    const title = "New feedback received";
    const details = `Client ${req.user.id} submitted feedback for request ${targetId}: rating=${rating}, comment=${comment || ""}`;
    for (const a of admins) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, sender_id) VALUES (?, ?, ?, ?)",
        [a.id, title, details, req.user.id]
      );
    }
  } catch (notifyError) {
    console.error("Failed to notify admins about feedback", notifyError);
  }

  res.status(201).json({ message: "Feedback saved", id: result.insertId });
};

// General feedback (complaints, app issues, etc.) — not tied to a collection
const createGeneralFeedback = async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  try {
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    const title = `Feedback: ${subject}`;
    const body = `From user ${req.user.id} (${req.user.role}): ${message}`;
    for (const a of admins) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, sender_id) VALUES (?, ?, ?, ?)",
        [a.id, title, body, req.user.id]
      );
    }
    res.status(201).json({ message: "Feedback submitted" });
  } catch (error) {
    console.error("Failed to submit general feedback", error);
    res.status(500).json({ message: "Could not submit feedback", error: error.message });
  }
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

module.exports = { createFeedback, getFeedbackByRequest, createGeneralFeedback };
