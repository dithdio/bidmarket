const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createItem } = require('../models/Item');

router.post('/', auth, async (req, res) => {
    try {
        const { title, description, starting_price, end_time } = req.body;

        // 1. Check for missing required fields
        if (!title || starting_price === undefined || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Validate Title length
        if (title.length <= 3 || title.length > 100) {
            return res.status(400).json({ error: 'Title must be between 4 and 100 characters' });
        }

        // 3. Validate Date (must be in the future)
        if (new Date(end_time) <= new Date()) {
            return res.status(400).json({ error: 'End time must be in the future' });
        }

        // 4. Create the item
        const newItem = await createItem({
            seller_id: req.user.id,
            title,
            description,
            starting_price,
            end_time
        });

        res.status(201).json(newItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating item' });
    }
});

module.exports = router;