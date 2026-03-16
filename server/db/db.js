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


module.exports = {
  query: (text, params) => pool.query(text, params),
};