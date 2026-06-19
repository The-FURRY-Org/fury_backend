const pool = require('../config/db');

async function run() {
  const requestId = 18;
  try {
    // pick first active collector
    const [collectors] = await pool.query("SELECT id, full_name FROM users WHERE role = 'collector' AND status = 'active' ORDER BY id ASC LIMIT 1");
    if (!collectors.length) {
      console.error('No active collectors found');
      process.exit(2);
    }
    const collector = collectors[0];

    // find admin id for notification sender
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' AND status='active' ORDER BY id ASC LIMIT 1");
    const adminId = admins.length ? admins[0].id : null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // create assignment
      const [res1] = await connection.query(
        `INSERT INTO collection_assignments (collection_request_id, collector_id, status, assigned_at) VALUES (?, ?, 'accepted', NOW())`,
        [requestId, collector.id]
      );

      // update request status
      await connection.query("UPDATE collection_requests SET status = 'accepted' WHERE id = ?", [requestId]);

      // create notification for collector
      if (adminId) {
        await connection.query(
          `INSERT INTO notifications (user_id, sender_id, title, message, status, created_at) VALUES (?, ?, ?, ?, 'unread', NOW())`,
          [collector.id, adminId, 'New assignment', `You have been assigned collection request #${requestId}.`, 'unread']
        );
      }

      await connection.commit();
      console.log('Assigned request', requestId, 'to collector', collector.id, collector.full_name);
      process.exit(0);
    } catch (err) {
      await connection.rollback();
      console.error('Failed to assign:', err.message);
      process.exit(2);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
}

run();
