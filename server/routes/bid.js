const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { findItemById } = require('../models/Item');
const { findBidbyBidId } = require('../models/Bid')
const db = require('../db/db');



module.exports = router;

// POST /api/bids
router.post('/', auth, async (req, res) => {
    try {
        const { item_id, amount } = req.body;

        if (!item_id || !amount) {
            return res.status(400).json({ error: 'item_id and amount are required' });
        }

        // Fetch the item to check its rules
        const item = await findItemById(item_id);

        if (!item) {
            return res.status(400).json({ error: 'Item does not exist' });
        }


        // Cannot bid on your own item
        if (item.seller_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot bid on your own item' });
        }

        //  Cannot place multiple concurrent bids on the same item 
        const existingBid = await db.query(
            'SELECT id FROM bids WHERE bidder_id = $1 AND item_id = $2', 
            [req.user.id, item_id]
        );
        if (existingBid.rows.length > 0) {
            return res.status(400).json({ error: 'You already have an active bid on this item' });
        }

        // Rule Check: Must be at least 10% higher than the current price
        const activePrice = Number(item.current_price || item.starting_price);
        const minimumBid = activePrice * 1.10;

        if (Number(amount) < minimumBid) {
            return res.status(400).json({ 
                error: `Bid must be at least 10% higher than the current price ($${minimumBid.toFixed(2)})` 
            });
        }

        // Insert the bid
        const newBidRes = await db.query(
            'INSERT INTO bids (bidder_id, item_id, amount) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, item_id, amount]
        );

        // Update the item's current price
        await db.query(
            'UPDATE items SET current_price = $1 WHERE id = $2',
            [amount, item_id]
        );

        res.status(201).json(newBidRes.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error placing bid' });
    }
});
// get /api/bids
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM bids WHERE bidder_id = $1 ORDER BY created_at DESC', 
            [req.user.id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching user bids' });
    }
});

// get /api/bids/item/:itemid
router.get('/item/:itemid', async (req, res) => {
    try {
        const { itemid } = req.params;

        if (isNaN(itemid)) {
            return res.status(400).json({ error: 'Invalid item ID format' });
        }

        // Verify the item actually exists first
        const itemCheck = await db.query('SELECT id FROM items WHERE id = $1', [itemid]);
        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Fetch all bids for it
        const result = await db.query(
            'SELECT * FROM bids WHERE item_id = $1 ORDER BY amount DESC', 
            [itemid]
        );
        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching item bids' });
    }
});


// get /api/bids/:bidid
router.get('/:bidid', async (req, res) => {
    try {
        const { bidid } = req.params;

        if (isNaN(bidid)) {
            return res.status(400).json({ error: 'Invalid bid ID format' });
        }

        const result = await findBidbyBidId(bidid);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bid not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching bid' });
    }
});

router.delete('/:bidid', auth, async (req, res) => {

    // We need a database transaction here so if the recalculation fails, 
    // the bid deletion gets rolled back automatically!
    const client = await db.pool.connect();

    try {
        const { bidid } = req.params;
        await client.query('BEGIN'); // Start transaction

        // Find the bid
        const bidRes = await findBidbyBidId(bidid);
        if (bidRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Bid not found' });
        }

        const bid = bidRes.rows[0];

        // 2. Security Check: Only the bidder can delete their bid
        if (bid.bidder_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Unauthorized to delete this bid' });
        }

        // 3. Delete the bid
        await client.query('DELETE FROM bids WHERE id = $1', [bidid]);

        // 4. The Recalculation Engine
        const maxBidRes = await client.query(
            'SELECT MAX(amount) as new_highest FROM bids WHERE item_id = $1',
            [bid.item_id]
        );
        
        const newHighest = maxBidRes.rows[0].new_highest;

        if (newHighest) {
            // Drop price down to the second-highest bid
            await client.query(
                'UPDATE items SET current_price = $1 WHERE id = $2', 
                [newHighest, bid.item_id]
            );
        } else {
            // No bids left! Reset the price back to its factory default
            await client.query(
                'UPDATE items SET current_price = starting_price WHERE id = $1', 
                [bid.item_id]
            );
        }

        await client.query('COMMIT'); // Save all changes
        res.status(200).json({ message: 'Bid deleted successfully' });

    } catch (err) {
        await client.query('ROLLBACK'); // Cancel changes if anything crashed
        console.error(err);
        res.status(500).json({ error: 'Server error deleting bid' });
    } finally {
        client.release(); // Give the connection back to the pool
    }
});

module.exports = router;