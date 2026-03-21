const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createItem, cancelItem, getBuyableItems, getListingItems, findItemById, getAllItems, updateItem  } = require('../models/Item');

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

router.patch('/:itemid', auth, async (req, res) => {
    try {
        const { title, description, end_time } = req.body;
        const { itemid } = req.params;

        // 1. Validate ID format
        if (isNaN(itemid)) {
            return res.status(400).json({ error: 'Invalid item ID format' });
        }

        // 2. Validate Title (only if provided)
        if (title !== undefined && (title.length <= 3 || title.length > 100)) {
            return res.status(400).json({ error: 'Title must be between 4 and 100 characters' });
        }

        // 3. Validate Description (only if provided)
        if (description !== undefined && description.length > 500) {
            return res.status(400).json({ error: 'Description is too long' });
        }

        // 4. Validate Date (only if provided)
        if (end_time !== undefined) {
            const date = new Date(end_time);
            if (isNaN(date.getTime()) || date <= new Date()) {
                return res.status(400).json({ error: 'End time must be a valid future date' });
            }
        }

        // 5. Update the item
        const updatedItem = await updateItem(itemid, req.user.id, { 
            title, 
            description, 
            end_time 
        });

        // 6. Handle Authorization/Existence check
        if (!updatedItem) {
            return res.status(403).json({ error: 'Unauthorized or item not found' });
        }

        res.status(200).json(updatedItem);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating item' });
    }
});

router.get('/all', async (req, res) => {
    try {
        const items = await getAllItems()
        res.status(200).json(items);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating item' });
    }
});

router.get('/buyableItems', auth, async (req, res) => {
    try {
        const userId = req.user.id
        const buyableItems = await getBuyableItems(userId);

        res.status(200).json(buyableItems);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error getting buyable items' });
    }
});

router.get('/listedItems', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const listingItems = await getListingItems(userId);

        res.status(200).json(listingItems);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error getting listed items' });
    }
});

router.get('/:itemid', async (req, res) => {
    try {
        const { itemid } = req.params;
        if (isNaN(itemid)) {
            return res.status(400).json({ error: 'Invalid item ID format' });
        }

        const item = await findItemById(itemid)
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.status(200).json(item);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating item' });
    }
});


// has problems getting valid item ids
router.delete('/:itemid', auth, async (req, res) => {
    try {
        const { itemid } = req.params;
        if (isNaN(itemid)) {
            return res.status(400).json({ error: 'Invalid item ID format' });
        }

        const canceledItem = await cancelItem(req.params.itemid, req.user.id);

        if (!canceledItem) {
        return res.status(403).json({ error: 'Unauthorized or item not found' });
        }

        res.status(200).json({ 
        message: 'Item canceled successfully', 
        item: canceledItem 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating item' });
    }
});


module.exports = router;