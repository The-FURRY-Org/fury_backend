const pool = require("../config/db");

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.status, n.created_at, n.read_at, n.sender_id, u.full_name AS sender_name
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch notifications", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = ? AND user_id = ?", [id, req.user.id]);
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.status, n.created_at, n.read_at, n.sender_id, u.full_name AS sender_name
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE n.id = ?`,
      [id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update notification", error: error.message });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { user_id, title, message } = req.body;
    if (!user_id || !title || !message) {
      return res.status(400).json({ message: "user_id, title and message are required" });
    }
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, sender_id) VALUES (?, ?, ?, ?)",
      [user_id, title, message, req.user.id]
    );
    res.status(201).json({ message: "Notification sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not send notification", error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, sendNotification };
