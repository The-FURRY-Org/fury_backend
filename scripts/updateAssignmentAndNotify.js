const pool = require('../config/db');

async function run() {
  const requestId = 18;
  try {
    // find assignment for the request
    const [assignments] = await pool.query(
      'SELECT ca.id, ca.collector_id, u.full_name AS collector_name, cr.client_id FROM collection_assignments ca JOIN users u ON u.id = ca.collector_id JOIN collection_requests cr ON cr.id = ca.collection_request_id WHERE ca.collection_request_id = ?',
      [requestId]
    );

    if (!assignments.length) {
      console.error('No assignment found for request', requestId);
      process.exit(2);
    }

    const assignment = assignments[0];

    // pick an admin to act as sender for notification
    const [admins] = await pool.query("SELECT id, full_name FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id ASC LIMIT 1");
    const admin = admins.length ? admins[0] : null;

    const collectorName = assignment.collector_name || 'collector';
    const notes = `Assigned to ${collectorName}. Collector will arrive shortly.`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE collection_assignments SET collection_notes = ? WHERE id = ?', [notes, assignment.id]);

      // insert notification to client
      const [clientRows] = await connection.query('SELECT client_id FROM collection_requests WHERE id = ?', [requestId]);
      const clientId = clientRows.length ? clientRows[0].client_id : null;

      if (clientId && admin) {
        await connection.query(
          'INSERT INTO notifications (user_id, sender_id, title, message, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [clientId, admin.id, 'Pickup assigned', `Your pickup request #${requestId} has been assigned to ${collectorName}. We will collect it shortly.`, 'unread']
        );
      }

      await connection.commit();
      console.log('Updated assignment', assignment.id, 'and notified client', clientId);
      process.exit(0);
    } catch (err) {
      await connection.rollback();
      console.error('Transaction failed:', err.message);
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
