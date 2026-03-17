const db = require('../db/db');

const createItem = async ({ seller_id, title, description, starting_price, end_time }) => {
    const query = `
        INSERT INTO items (seller_id, title, description, starting_price, current_price, end_time)
        VALUES ($1, $2, $3, $4, $4, $5)
        RETURNING *;
    `;
    const values = [seller_id, title, description, starting_price, end_time];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = { createItem };