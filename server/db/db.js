// db.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Supabase Connection Error:', err.message);
  } else {
    console.log('✅ Supabase Connected Successfully at:', res.rows[0].now);
  }
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { duration }); // see how long the internet trip takes!
  return res;
}


module.exports = {
  query,
  pool
};