import { pool } from './server/config/database.js';
const [rows] = await pool.execute('SELECT id, name, image_url, is_active, created_at, updated_at FROM genres WHERE id IN (34,35)');
console.log(JSON.stringify(rows, null, 2));
await pool.end();
