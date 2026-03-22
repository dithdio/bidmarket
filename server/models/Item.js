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

const findItemById = async (id) => {
    const result = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    return result.rows[0];
}

const cancelItem = async (id, seller_id) => {
    const query = `
        UPDATE items 
        SET status = 'canceled' 
        WHERE id = $1 AND seller_id = $2 
        RETURNING *;
    `;
    const result = await db.query(query, [id, seller_id]);
    return result.rows[0];
}

// Get items for the "Marketplace" (Active and NOT mine)
const getBuyableItems = async (userId) => {
    const query = `
        SELECT * FROM items 
        WHERE seller_id != $1 AND status = 'active' AND end_time > NOW()
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
}

// Get items I am selling
const getListingItems = async (userId) => {
    const query = 'SELECT * FROM items WHERE seller_id = $1 ORDER BY created_at DESC;';
    const result = await db.query(query, [userId]);
    return result.rows;
}

const getAllItems = async () => {
    const query = "SELECT * FROM items WHERE status = 'active'"; 
    const result = await db.query(query);
    return result.rows;
}

const updateItem = async(id, userId, updates) => {
        const { title, description, end_time } = updates;
        // Use COALESCE to keep old values if new ones aren't provided
        const query = `
            UPDATE items 
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                end_time = COALESCE($3, end_time)
            WHERE id = $4 AND seller_id = $5 AND status = 'active'
            RETURNING *;
        `;
        const values = [title, description, end_time, id, userId];
        const result = await db.query(query, values);
        return result.rows[0];
}



module.exports = { createItem, cancelItem, getBuyableItems, getListingItems, findItemById, getAllItems, updateItem }