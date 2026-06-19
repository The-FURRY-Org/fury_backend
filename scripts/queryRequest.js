const pool = require('../config/db');

async function run() {
  try {
    const [rows] = await pool.query(
      `SELECT cr.id, cr.client_id, u.full_name, cr.location_id, cl.location_name, cr.waste_category_id, cr.description, cr.urgency, cr.estimated_bin_level, cr.status, cr.created_at
       FROM collection_requests cr
       JOIN users u ON u.id = cr.client_id
       JOIN customer_locations cl ON cl.id = cr.location_id
       WHERE cr.id = ?`,
      [18]
    );
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err.message);
    process.exit(2);
  }
}

run();
