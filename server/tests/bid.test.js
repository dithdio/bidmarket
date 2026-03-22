const request = require('supertest');
const { app, server } = require('../index');
const db = require('../db/db');
const { findUserByEmail } = require('../models/User'); 
const { findItemById } = require('../models/Item')



const TEST_USERS = [
    {
        username: 'api_tester',
        email: 'api@test.com',
        password: 'password123'
    },
    {
        username: 'api_tester2',
        email: 'api2@test.com',
        password: 'password123'
    },
    { 
        username: 'newbie',
        email: 'new@test.com', 
        password: 'password123' 
    }

    ];

const TEST_ITEMS = [
    {
        title: 'Vintage Camera',
        description: 'Perfect condition 35mm',
        starting_price: 50.00,
        end_time: '2026-12-31T23:59:59Z'
    },
    {
        title: 'Gaming Laptop',
        description: 'RTX 4080, 32GB RAM',
        starting_price: 1200.99,
        end_time: '2026-11-20T10:00:00Z'
    },
    {
        title: 'Handmade Mug',
        description: 'Blue ceramic',
        starting_price: 5.00,
        end_time: '2026-05-01T12:00:00Z'
    },
    {
        title: 'This is a title', 
        description: 'this is a valid d3scription !!!',
        starting_price: 33.00,
        end_time: '2026-12-31T23:59:59Z'
    },
    {
        title: 'Budget Sticker',
        description: 'A tiny item to test the lowest possible price point.',
        starting_price: 0.01,
        end_time: '2026-06-01T12:00:00Z'
    },
    {
        title: 'High-End Luxury Yacht',
        description: 'Testing a massive price and a very long description ' + 'a'.repeat(200),
        starting_price: 999999.99,
        end_time: '2026-12-01T00:00:00Z'
    },
    {
        title: 'Quick 24h Auction',
        description: 'Testing an auction that ends very soon.',
        starting_price: 15.50,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
];



let token; 
let token2;
let token3;
let bidder_ids = [];
let item_ids = [];

// create all users and create items for user 1 and 2 
beforeAll(async () => {
    const reg1 = await request(app).post('/api/users/register').send(TEST_USERS[0]);
    token = reg1.body.token;

    const reg2 = await request(app).post('/api/users/register').send(TEST_USERS[1]);
    token2 = reg2.body.token;

    const reg3 = await request(app).post('/api/users/register').send(TEST_USERS[2]);
    token3 = reg3.body.token;

    for (let user of TEST_USERS) {
        const dbUser = await findUserByEmail(user.email);
        bidder_ids.push(dbUser.id);
    }

    for (let i = 0; i < TEST_ITEMS.length; i++) {
        // Determine which token to use based on even/odd index
        const currentToken = (i % 2 === 0) ? token : token2;
        const itemRes = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${currentToken}`)
            .send(TEST_ITEMS[i]);
        item_ids.push(itemRes.body.id);
    }
    // testuser gonna have items 0, 2 , 4 and testuser2 gonna have 1, 3 , 5 
}, 15000);

beforeEach( async () => {
    await db.query('DELETE FROM bids WHERE bidder_id = ANY($1)', [bidder_ids]);

    await db.query(`
        UPDATE items 
        SET current_price = starting_price, 
            status = 'active'
        WHERE id = ANY($1)
    `, [item_ids]);

});

// clear out all bids, items and users 
afterAll(async () => {
await db.query('DELETE FROM bids WHERE bidder_id = ANY($1)', [bidder_ids]);
    
    const titles = TEST_ITEMS.map(item => item.title);
    await db.query('DELETE FROM items WHERE title = ANY($1)', [titles]);
    const emails = TEST_USERS.map(user => user.email);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
    
    await db.pool.end();
    server.close();
});

describe('POST /api/bids', () => {
    test('SUCCESS: Should return newly created bid', async () => {
        const testBid = {
            item_id: item_ids[0],
            amount: 80.00
        };
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send(testBid);
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
            bidder_id: bidder_ids[1],
            item_id: item_ids[0],
            amount: "80.00"
        });
        expect(response.body).toHaveProperty('created_at');

        // current price should have changed for the item too.

        const updatedItem = await findItemById(item_ids[0]);
        expect(Number(updatedItem.current_price)).toBe(80.00);
    });


    test.each(['item_id', 'amount'])(
        'It should fail if %s is missing', 
        async (field) => {
            const testBid = {
                item_id: item_ids[0],
                amount: 80.00
            };
            // 1. Start with a perfectly valid item
            const sampleBid = { ...testBid };
            // 2. Remove the specific field we are testing
            delete sampleBid[field];
            // 3. Send the request
            const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send(sampleBid);

            expect(response.statusCode).toBe(400); 
            expect(response.body).toHaveProperty('error'); 
        }
    );

    test('NEGATIVE: Should fail if the token is invalid', async () => {
        const testBid = {
                item_id: item_ids[0],
                amount: 80.00
        };
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', 'Bearer not-a-real-token')
            .send(testBid);
        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: Should fail if no token is provided', async () => {
        const testBid = {
                item_id: item_ids[0],
                amount: 80.00
        };
        const response = await request(app).post('/api/bids')
        .send(testBid);
        expect(response.statusCode).toBe(401);
    });

    test('FAILURE: item_id must exist', async () => {
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: 123456, amount: 56.99});
        expect(response.statusCode).toBe(400);
    });

    test('FAILURE: bid amount should be at least 10% or more than current price', async () => {
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0], amount: 54.99});
        expect(response.statusCode).toBe(400);
    });

    test('FAILURE: cant bid on your own item', async () => {
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({item_id: item_ids[0], amount: 200});
        expect(response.statusCode).toBe(400);
    });

    test('FAILURE: cant place 2 bids on 1 item', async () => {
        await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0], amount: 200});
        const response = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0], amount: 300});
        expect(response.statusCode).toBe(400);

    });

});

describe (' needs multiple bids', () => {
    let multiBids = [];
    beforeEach(async () => {
        multiBids = [];

        await db.query('DELETE FROM bids');

        const bidsToCreate = [
            // Bid 1: User 2 bids on User 1's Item 0 (Starts at $50)
            { token: token2, item_id: item_ids[0], amount: 60.00 },
            
            // Bid 2: User 3 outbids User 2 on Item 0 (Must be > $66)
            { token: token3, item_id: item_ids[0], amount: 75.00 },
            
            // Bid 3: User 1 bids on User 2's Item 1 (Starts at $1200.99)
            { token: token, item_id: item_ids[1], amount: 1400.00 },
            
            // Bid 4: User 2 bids on User 1's Item 2 (Starts at $5.00)
            { token: token2, item_id: item_ids[2], amount: 10.00 }
        ];

        // Loop through and create them
        for (let i = 0; i < bidsToCreate.length; i++) {
            const currentBid = bidsToCreate[i];
            const res = await request(app)
                .post('/api/bids')
                .set('Authorization', `Bearer ${currentBid.token}`)
                .send({ item_id: currentBid.item_id, amount: currentBid.amount });
            
            // SAFETY CHECK: If a bid violates a rule, the setup will fail here!
            expect(res.statusCode).toBe(201); 
            
            multiBids.push(res.body);
        }
    });

    // should get all of the user's active bids
    describe('get /api/bids', () => {
        test('SUCCESS: Should return exactly 2 bids for User 2', async () => {
            const res = await request(app)
                .get('/api/bids')
                .set('Authorization', `Bearer ${token2}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);

            // User 2 bid on Item 0 and Item 2. Let's make sure those are the items returned!
            const returnedItemIds = res.body.map(bid => bid.item_id);
            expect(returnedItemIds).toContain(item_ids[0]);
            expect(returnedItemIds).toContain(item_ids[2]);
        });

        test('SUCCESS: Should return exactly 1 bid for User 1', async () => {
            const res = await request(app)
                .get('/api/bids')
                .set('Authorization', `Bearer ${token}`); 
            
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].item_id).toBe(item_ids[1]);
        });

        test('NEGATIVE: Should fail if no authentication token is provided', async () => {
            const res = await request(app).get('/api/bids');
            expect(res.statusCode).toBe(401);
        });
    });

    // should get all of an item's active bids
    describe('get /api/bids/item/:itemid', () => {
        test('SUCCESS: Should return exactly 2 bids for Item 0', async () => {
            const res = await request(app).get(`/api/bids/item/${item_ids[0]}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);

            // Verify both User 2 and User 3's bids are present
            const bidderIds = res.body.map(bid => bid.bidder_id);
            expect(bidderIds).toContain(bidder_ids[1]); // User 2's ID
            expect(bidderIds).toContain(bidder_ids[2]); // User 3's ID
        });

        test('SUCCESS: Should return an empty array if the item exists but has no bids', async () => {
            // Item 3 has no bids in our setup!
            const res = await request(app).get(`/api/bids/item/${item_ids[3]}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        test('NEGATIVE: Should return 400 if the item ID format is invalid', async () => {
            const res = await request(app).get('/api/bids/item/invalid-id');
            expect(res.statusCode).toBe(400);
        });

        test('NEGATIVE: Should return 404 if the item ID does not exist in the database', async () => {
            const res = await request(app).get('/api/bids/item/999999');
            expect(res.statusCode).toBe(404);
        });
    });

    // should delete a specific bid
    describe('delete /api/bids/:bidid', () => {
        test('SUCCESS: Should delete the highest bid and reduce the item price to the second highest', async () => {
            // Target Bid 2 (Index 1): User 3's $75 bid on Item 0. 
            // The next highest bid is User 2's $60 bid.
            const bidToDelete = multiBids[1]; 
            
            const res = await request(app)
                .delete(`/api/bids/${bidToDelete.id}`)
                .set('Authorization', `Bearer ${token3}`); // Must use User 3's token!
                
            expect(res.statusCode).toBe(200);
            
            // Fetch the item to verify the price dropped to $60
            const itemRes = await request(app).get(`/api/items/${item_ids[0]}`);
            
            // Note: Wrapping in Number() in case Postgres returns the DECIMAL as a string
            expect(Number(itemRes.body.current_price)).toBe(60.00); 
        });

        test('SUCCESS: Should delete the ONLY bid and reset the item price to its starting_price', async () => {
            // Target Bid 4 (Index 3): User 2's $10 bid on Item 2.
            // Item 2's starting price is $5.00.
            const bidToDelete = multiBids[3];
            
            const res = await request(app)
                .delete(`/api/bids/${bidToDelete.id}`)
                .set('Authorization', `Bearer ${token2}`);
                
            expect(res.statusCode).toBe(200);
            
            // Fetch the item to verify the price reset to $5.00
            const itemRes = await request(app).get(`/api/items/${item_ids[2]}`);
            expect(Number(itemRes.body.current_price)).toBe(5.00);
        });

        test('SUCCESS: Should delete a losing bid WITHOUT changing the item price', async () => {
            // Target Bid 1 (Index 0): User 2's $60 bid on Item 0. 
            // The highest bid is still User 3's $75 bid.
            const bidToDelete = multiBids[0];
            
            const res = await request(app)
                .delete(`/api/bids/${bidToDelete.id}`)
                .set('Authorization', `Bearer ${token2}`);
                
            expect(res.statusCode).toBe(200);
            
            // Fetch the item to verify the price stayed at $75.00
            const itemRes = await request(app).get(`/api/items/${item_ids[0]}`);
            expect(Number(itemRes.body.current_price)).toBe(75.00);
        });

        test('NEGATIVE: Should return 403 if a user tries to delete someone else\'s bid', async () => {
            // Target Bid 3 (Index 2): User 1's $1400 bid.
            const bidToDelete = multiBids[2];
            
            // Try to delete it using User 2's token
            const res = await request(app)
                .delete(`/api/bids/${bidToDelete.id}`)
                .set('Authorization', `Bearer ${token2}`);
                
            expect(res.statusCode).toBe(403);
            
            // Verify the item price wasn't  altered
            const itemRes = await request(app).get(`/api/items/${item_ids[1]}`);
            expect(Number(itemRes.body.current_price)).toBe(1400.00);
        });

        test('NEGATIVE: Should return 401 if no token is provided', async () => {
            const bidToDelete = multiBids[0];
            const res = await request(app).delete(`/api/bids/${bidToDelete.id}`);
            expect(res.statusCode).toBe(401);
        });

        test('NEGATIVE: Should return 404 if the bid ID does not exist', async () => {
            const res = await request(app)
                .delete('/api/bids/999999')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(404);
        });
    });



})
// should get a specific bid
describe('get /api/bids/:bidid', () => {
    test('SUCCESS: Should return a specific bid by its ID', async () => { 
        const postResponse = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0], amount: 100.00});
        // console.log(postResponse.body)
        const bidId = postResponse.body.id
        // console.log(bidId);
        
        const getResponse = await request(app)
            .get(`/api/bids/${bidId}`);
        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body).toMatchObject({
            bidder_id: bidder_ids[1],
            item_id: item_ids[0],
            amount: "100.00"
        });
    });

    test('NEGATIVE: Should return 404 if the item ID does not exist', async () => {
        const nonExistentId = 999999;
        
        const response = await request(app)
            .get(`/api/bids/${nonExistentId}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toMatch(/not found/i);
    });

    test('NEGATIVE: Should return 400 if the ID format is invalid', async () => {
        const response = await request(app)
            .get('/api/bids/not-a-number');
        expect(response.statusCode).toBe(400);
    });
});  


