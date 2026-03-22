const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/db');

// POST /api/watchlist
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC', 
            [req.user.id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching watchlist' });
    }
});

// POST /api/watchlist/item/:itemid

router.get('/item/:itemid', async (req, res) => {
    try {
        const { itemid } = req.params;

        if (isNaN(itemid)) {
            return res.status(400).json({ error: 'Invalid item ID format' });
        }

        const itemCheck = await db.query('SELECT id FROM items WHERE id = $1', [itemid]);
        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const result = await db.query(
            'SELECT * FROM watchlist WHERE item_id = $1 ORDER BY created_at DESC', 
            [itemid]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching item watchers' });
    }
});

// POST /api/watchlist/
router.post('/', auth, async (req, res) => {
    try {
        const { item_id } = req.body;

        if (!item_id) {
            return res.status(400).json({ error: 'item_id is required' });
        }

        // 1. Verify item exists and check who the seller is
        const itemRes = await db.query('SELECT seller_id FROM items WHERE id = $1', [item_id]);
        if (itemRes.rows.length === 0) {
            return res.status(400).json({ error: 'Item does not exist' });
        }

        // 2. Cannot watch your own item
        if (itemRes.rows[0].seller_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot watch your own item' });
        }

        // 3. Cannot watch the same item twice
        const existingWatch = await db.query(
            'SELECT id FROM watchlist WHERE user_id = $1 AND item_id = $2', 
            [req.user.id, item_id]
        );
        if (existingWatch.rows.length > 0) {
            return res.status(400).json({ error: 'You are already watching this item' });
        }

        // 4. Insert into watchlist
        const newWatchRes = await db.query(
            'INSERT INTO watchlist (user_id, item_id) VALUES ($1, $2) RETURNING *',
            [req.user.id, item_id]
        );

        res.status(201).json(newWatchRes.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding to watchlist' });
    }
});

// POST /api/watchlist/:watchid
router.delete('/:watchid', auth, async (req, res) => {
    try {
        const { watchid } = req.params;

        // 1. Find the watchlist entry
        const watchRes = await db.query('SELECT * FROM watchlist WHERE id = $1', [watchid]);
        if (watchRes.rows.length === 0) {
            return res.status(404).json({ error: 'Watchlist entry not found' });
        }

        const watchEntry = watchRes.rows[0];

        // 2. Security Check: Only the owner can delete it
        if (watchEntry.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to remove this entry' });
        }

        // 3. Delete it and return the deleted row so your test assertions pass!
        const deleteRes = await db.query(
            'DELETE FROM watchlist WHERE id = $1 RETURNING *', 
            [watchid]
        );

        res.status(200).json(deleteRes.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error removing from watchlist' });
    }
});

module.exports = router;