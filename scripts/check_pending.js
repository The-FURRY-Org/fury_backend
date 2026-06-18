require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cleantrack_uganda'
  });

  const [rows] = await conn.query("SELECT id, client_id, status, description, requested_at FROM collection_requests WHERE client_id = ? ORDER BY requested_at DESC", [11]);
  console.log(`Found ${rows.length} requests for client_id=11:`);
  rows.forEach(r => console.log(r));
  await conn.end();
})();
