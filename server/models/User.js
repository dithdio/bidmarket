const db = require('../db/db');

const createUser = async (username, email, password) => {
    const query = `
        INSERT INTO users (username, email, password) 
        VALUES ($1, $2, $3) 
        RETURNING id, username, email, balance, created_at;
    `;
    const result = await db.query(query, [username, email, password]);
    return result.rows[0];
};