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
    await db.query('DELETE FROM watchlist WHERE user_id = ANY($1)', [bidder_ids]);
});

// clear out all bids, items and users 
afterAll(async () => {
await db.query('DELETE FROM watchlist WHERE user_id = ANY($1)', [bidder_ids]);
    
    const titles = TEST_ITEMS.map(item => item.title);
    await db.query('DELETE FROM items WHERE title = ANY($1)', [titles]);
    const emails = TEST_USERS.map(user => user.email);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
    
    await db.pool.end();
    server.close();
});

describe('POST /api/watchlist', () => {
    test('SUCCESS: Should return newly created watchlist entry', async () => {

        const response = await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0]});
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
            user_id: bidder_ids[1],
            item_id: item_ids[0]
        });
        expect(response.body).toHaveProperty('created_at');
    });

    test('NEGATIVE: Should fail if the token is invalid', async () => {

        const response = await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer invalid}`)
            .send({item_id: item_ids[0]});

        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: Should fail if no token is provided', async () => {

        const response = await request(app)
            .post('/api/watchlist')
            .send({item_id: item_ids[0]});
        
        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: item_id must exist', async () => {
        const response = await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: 124124 });

        expect(response.statusCode).toBe(400);
    });


    test('NEGATIVE: cant watch on your own item', async () => {
        const response = await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer ${token}`)
            .send({item_id: item_ids[0]});
        expect(response.statusCode).toBe(400);
    });

    test('NEGATIVE: cant watch the same item twice', async () => {
        await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0]});
        const response = await request(app)
            .post('/api/watchlist')
            .set('Authorization', `Bearer ${token2}`)
            .send({item_id: item_ids[0]});
        expect(response.statusCode).toBe(400);
    });

});

describe (' needs multiple watched', () => {
    let multiWatch = [];
    beforeEach(async () => {
        multiWatch = [];

        const watchlistToCreate = [
            // Watch 1: User 2 watches User 1's Item 1
            { token: token2, item_id: item_ids[0] },
            
            // Watch 2: User 3 watches user 1's item 1
            { token: token3, item_id: item_ids[0]},
            
            // Watch 3: User 1 watches User 2's Item 1
            { token: token, item_id: item_ids[1] },
            
            // Watch 4: User 2 watches User 1's Item 2 
            { token: token2, item_id: item_ids[2] }
        ];

        // Loop through and create them
        for (let i = 0; i < watchlistToCreate.length; i++) {
            const currentWatch = watchlistToCreate[i];
            const res = await request(app)
                .post('/api/watchlist')
                .set('Authorization', `Bearer ${currentWatch.token}`)
                .send({ item_id: currentWatch.item_id });
            
            expect(res.statusCode).toBe(201); 
            
            multiWatch.push(res.body);
        }
    });

    // should get all of the user's watchlist
    describe('get /api/watchlist', () => {
        test('SUCCESS: Should return exactly 2 in watchlist for User 2', async () => {
            const res = await request(app)
                .get('/api/watchlist')
                .set('Authorization', `Bearer ${token2}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);

            // User 2 watching on Item 0 and Item 2. Let's make sure those are the items returned!
            const returnedItemIds = res.body.map(watch => watch.item_id);
            expect(returnedItemIds).toContain(item_ids[0]);
            expect(returnedItemIds).toContain(item_ids[2]);
        });

        test('SUCCESS: Should return exactly 1 watched for User 1', async () => {
            const res = await request(app)
                .get('/api/watchlist')
                .set('Authorization', `Bearer ${token}`); 
            
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].item_id).toBe(item_ids[1]);
        });

        test('NEGATIVE: Should fail if no authentication token is provided', async () => {
            const res = await request(app).get('/api/watchlist');
            expect(res.statusCode).toBe(401);
        });
    });

    // should get all of an item's active watchers
    describe('get /api/watchlist/item/:itemid', () => {
        test('SUCCESS: Should return exactly 2 watches for Item 0', async () => {
            const res = await request(app).get(`/api/watchlist/item/${item_ids[0]}`);
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);

            // Verify both User 2 and User 3's watchlist are present
            const watchIds = res.body.map(watch => watch.user_id);
            expect(watchIds).toContain(bidder_ids[1]); // User 2's ID
            expect(watchIds).toContain(bidder_ids[2]); // User 3's ID
        });

        test('SUCCESS: Should return an empty array if the item exists but has none watching', async () => {
            // Item 3 has no bids in our setup!
            const res = await request(app).get(`/api/watchlist/item/${item_ids[3]}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        test('NEGATIVE: Should return 400 if the item ID format is invalid', async () => {
            const res = await request(app).get('/api/watchlist/item/invalid-id');
            expect(res.statusCode).toBe(400);
        });

        test('NEGATIVE: Should return 404 if the item ID does not exist in the database', async () => {
            const res = await request(app).get('/api/watchlist/item/999999');
            expect(res.statusCode).toBe(404);
        });
    });

    // should delete a specific watchliust item
    describe('delete /api/watchlist/:watchid', () => {
        test('SUCCESS: Should delete the appropriate item from watchlist', async () => {
            const watchToDelete = multiWatch[1]; 
            
            const deleteRes = await request(app)
                .delete(`/api/watchlist/${watchToDelete.id}`)
                .set('Authorization', `Bearer ${token3}`); // Must use User 3's token!
            
            expect(deleteRes.statusCode).toBe(200);
            expect(deleteRes.body).toMatchObject({user_id: bidder_ids[2], item_id: item_ids[0] })
            // user 3 should now not be watching anything
            
            const res = await request(app)
                .get('/api/watchlist')
                .set('Authorization', `Bearer ${token3}`); 
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);

            
        });

        test('NEGATIVE: Should return 403 if a user tries to delete someone else\'s watch', async () => {

            const watchToDelete = multiWatch[2];
            
            // Try to delete it using User 2's token
            const res = await request(app)
                .delete(`/api/watchlist/${watchToDelete.id}`)
                .set('Authorization', `Bearer ${token2}`);
                
            expect(res.statusCode).toBe(403);

        });

        test('NEGATIVE: Should return 401 if no token is provided', async () => {
            const watchToDelete = multiWatch[0];
            const res = await request(app).delete(`/api/watchlist/${watchToDelete.id}`);
            expect(res.statusCode).toBe(401);
        });

        test('NEGATIVE: Should return 404 if the watch ID does not exist', async () => {
            const res = await request(app)
                .delete('/api/watchlist/999999')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(404);
        });
    });

})


