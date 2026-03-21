const request = require('supertest');
const app = require('../index');
const db = require('../db/db');

let token; 
let token2;

const TEST_USER = {
    username: 'api_tester',
    email: 'api@test.com',
    password: 'password123'
};

const TEST_USER2 = {
    username: 'api_tester2',
    email: 'api2@test.com',
    password: 'password123'
};



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

const cleanup = async () => {
    const titles = TEST_ITEMS.map(item => item.title);
    await db.query('DELETE FROM items WHERE title = ANY($1)', [titles]);
};

beforeAll(async () => {
    const regRes = await request(app)
        .post('/api/users/register')
        .send(TEST_USER);
    token = regRes.body.token;
});



// After the whole file is done: Clean up the mess and close the connection
afterAll(async () => {
    await cleanup(); // Final wipe of items
    await db.query('DELETE FROM users WHERE email = ANY($1)', [TEST_USER.email, TEST_USER2.email]); // final wipe of users
    await db.pool.end(); // Essential for Jest to exit
});

describe('POST /api/items', () => {
    // Before each individual test: Start with a clean slate
    beforeEach(async () => {
        await cleanup();
    });
    test('SUCCESS: Should return newly created item', async () => {
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(TEST_ITEMS[0]);;
        
        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe(TEST_ITEMS[0].title);
        expect(response.body).toHaveProperty('created_at');
    });


    test.each(['title', 'starting_price', 'end_time'])(
        'It should fail if %s is missing', 
        async (field) => {
            // 1. Start with a perfectly valid item
            const sampleItem = { ...TEST_ITEM[0] };
            // 2. Remove the specific field we are testing
            delete sampleItem[field];
            // 3. Send the request
            const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(sampleItem);

            expect(response.statusCode).toBe(400); 
            expect(response.body).toHaveProperty('error'); 
        }
    );

    test('NEGATIVE: Should fail if the token is invalid', async () => {
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', 'Bearer not-a-real-token')
            .send(TEST_ITEMS[0]);
        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: Should fail if no token is provided', async () => {
        const response = await request(app).post('/api/items')
        .send(TEST_ITEMS[0]);
        expect(response.statusCode).toBe(401);
    });


    test('NEGATIVE: Should fail if the title is less than or equal to 3 characters', async () => {
        const sampleItem = {
            title: 'The', 
            description: 'this is a valid d3scription !!!',
            starting_price: 33.00,
            end_time: '2026-12-31T23:59:59Z'
        }
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(sampleItem);
        
        expect(response.statusCode).toBe(400); 
        expect(response.body).toHaveProperty('error')
    });

    test('NEGATIVE: Should fail if the title is more than 100 characters', async () => {
        const sampleItem = {
            title: 'TheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheThTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheTheeTheTheTheTheTheTheTheThe', 
            description: 'this is a valid d3scription !!!',
            starting_price: 33.00,
            end_time: '2026-12-31T23:59:59Z'
        }
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(sampleItem);
        
        expect(response.statusCode).toBe(400); 
        expect(response.body).toHaveProperty('error')

    });


    test('NEGATIVE: Should fail if the date has already passed', async () => {
        const sampleItem = {
            title: 'The', 
            description: 'this is a valid d3scription !!!',
            starting_price: 33.00,
            end_time: '2023-12-31T23:59:59Z'
        }
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(sampleItem);
        
        expect(response.statusCode).toBe(400); 
        expect(response.body).toHaveProperty('error')
    })
});

// get all items a user does not own and does not have a bid on
// need to add a bid to these to change 

describe('needs multiple items among 2 users', () => {
    beforeAll(async () => {
        const regRes = await request(app)
            .post('/api/users/register')
            .send(TEST_USER2);
        token2 = regRes.body.token;

        for (let i = 0; i < TEST_ITEMS.length; i++) {
            // Determine which token to use based on even/odd index
            const currentToken = (i % 2 === 0) ? token : token2;
            await request(app)
                .post('/api/items')
                .set('Authorization', `Bearer ${currentToken}`)
                .send(TEST_ITEMS[i]);
        }
        // testuser gonna have items 0, 2 , 4 and testuser2 gonna have 1, 3 , 5 
    });

    describe('GET /api/buyableItems', () => {
        test('POSITIVE: Should return items that each user can buy (excluding their own)', async () => {

            const res1 = await request(app)
                .get('/api/buyableItems')
                .set('Authorization', `Bearer ${token}`);
    
            expect(res1.statusCode).toBe(200);
            expect(Array.isArray(res1.body)).toBe(true);
    
            // User 1 should NOT see their own titles (Items 0, 2, 4)
            const user1Titles = res1.body.map(item => item.title);
            expect(user1Titles).not.toContain(TEST_ITEMS[0].title);
            expect(user1Titles).toContain(TEST_ITEMS[1].title); // They SHOULD see User 2's item
    
            const res2 = await request(app)
                .get('/api/buyableItems')
                .set('Authorization', `Bearer ${token2}`);
    
            expect(res2.statusCode).toBe(200);
    
            // User 2 should NOT see their own titles (Items 1, 3, 5)
            const user2Titles = res2.body.map(item => item.title);
            expect(user2Titles).not.toContain(TEST_ITEMS[1].title);
            expect(user2Titles).toContain(TEST_ITEMS[0].title); // They SHOULD see User 1's item
        });
    
        test('NEGATIVE: Should fail if no token is provided', async () => {
            const res = await request(app).get('/api/buyableItems');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/listedItems', () => {
        test('POSITIVE: Should return only the items listed by the current user', async () => {

            const res1 = await request(app)
                .get('/api/listedItems')
                .set('Authorization', `Bearer ${token}`);
    
            expect(res1.statusCode).toBe(200);
            expect(Array.isArray(res1.body)).toBe(true);
    
            const titles1 = res1.body.map(item => item.title);
    
            // User 1 should see Item 0 and Item 2, but NOT Item 1
            expect(titles1).toContain(TEST_ITEMS[0].title);
            expect(titles1).toContain(TEST_ITEMS[2].title);
            expect(titles1).not.toContain(TEST_ITEMS[1].title);
    
            const res2 = await request(app)
                .get('/api/listedItems')
                .set('Authorization', `Bearer ${token2}`);
    
            expect(res2.statusCode).toBe(200);
            const titles2 = res2.body.map(item => item.title);
    
            // User 2 should see Item 1 and Item 3, but NOT Item 0
            expect(titles2).toContain(TEST_ITEMS[1].title);
            expect(titles2).toContain(TEST_ITEMS[3].title);
            expect(titles2).not.toContain(TEST_ITEMS[0].title);
        });
    
        test('NEGATIVE: Should return an empty array if the user has no listings', async () => {
            // Create a brand new user who hasn't posted anything
            const tempUser = { username: 'newbie', email: 'new@test.com', password: 'password123' };
            const regRes = await request(app).post('/api/users/register').send(tempUser);
            const tempToken = regRes.body.token;
    
            const res = await request(app)
                .get('/api/listedItems')
                .set('Authorization', `Bearer ${tempToken}`);
    
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]); 
        });
    
        test('NEGATIVE: Should fail if no token is provided', async () => {
            const res = await request(app).get('/api/listedItems');
            expect(res.statusCode).toBe(401);
        });
    });  
        
});

describe('GET /api/items/:itemid', () => {
    
    test('SUCCESS: Should return a specific item by its ID', async () => {
        const itemResult = await db.query(
            'SELECT id FROM items WHERE title = $1 LIMIT 1', 
            [TEST_ITEMS[0].title]
        );
        const validId = itemResult.rows[0].id;

        const response = await request(app)
            .get(`/api/items/${validId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe(TEST_ITEMS[0].title);
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('seller_id');
    });

    test('NEGATIVE: Should return 404 if the item ID does not exist', async () => {
        const nonExistentId = 999999;
        
        const response = await request(app)
            .get(`/api/items/${nonExistentId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toMatch(/not found/i);
    });

    test('NEGATIVE: Should return 400 if the ID format is invalid', async () => {
        const response = await request(app)
            .get('/api/items/not-a-number')
            .set('Authorization', `Bearer ${token}`);


        expect(response.statusCode).toBe(400);
    });

    test('NEGATIVE: Should fail if no token is provided', async () => {
        const itemResult = await db.query('SELECT id FROM items LIMIT 1');
        const validId = itemResult.rows[0].id;

        const response = await request(app).get(`/api/items/${validId}`);
        
        expect(response.statusCode).toBe(401);
    });
});

describe('DELETE /api/items/:itemid (Soft Delete)', () => {

    test('SUCCESS: Should mark the item as canceled if owned by the user', async () => {

        const itemRes = await db.query(
            'SELECT id FROM items WHERE title = $1 LIMIT 1', 
            [TEST_ITEMS[0].title]
        );
        const validId = itemRes.rows[0].id;

        const response = await request(app)
            .delete(`/api/items/${validId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        const dbCheck = await db.query('SELECT status FROM items WHERE id = $1', [validId]);
        expect(dbCheck.rows[0].status).toBe('canceled');
    });

    test('NEGATIVE: Should return 403 if User 2 tries to cancel User 1\'s item', async () => {
        // 1. Get User 1's item ID
        const itemRes = await db.query(
            'SELECT id FROM items WHERE title = $1 LIMIT 1', 
            [TEST_ITEMS[0].title]
        );
        const user1ItemId = itemRes.rows[0].id;

        // 2. Act: Try to delete using User 2's token
        const response = await request(app)
            .delete(`/api/items/${user1ItemId}`)
            .set('Authorization', `Bearer ${token2}`);

        // 3. Assert: Forbidden!
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toMatch(/unauthorized/i);
        
        // Verify it remained 'active'
        const dbCheck = await db.query('SELECT status FROM items WHERE id = $1', [user1ItemId]);
        expect(dbCheck.rows[0].status).toBe('active');
    });

    test('NEGATIVE: Should return 401 if no token is provided', async () => {
        const response = await request(app).delete('/api/items/1');
        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: Should return 404/403 if the item ID does not exist', async () => {
        const fakeId = 999999;
        const response = await request(app)
            .delete(`/api/items/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        // Since the 'WHERE seller_id = $2' fails, it returns 403 in the route we wrote
        expect(response.statusCode).toBe(403); 
    });

    test('NEGATIVE: Should return 400 if the item ID format is invalid', async () => {
        const response = await request(app)
            .delete('/api/items/abc-123')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toMatch(/format/i);
    });
});

describe('GET /api/items', () => {

    test('SUCCESS: Should return all active items from all users', async () => {

        const regRes = await request(app)
            .post('/api/users/register')
            .send(TEST_USER2);
        token2 = regRes.body.token;

        for (let i = 0; i < TEST_ITEMS.length; i++) {
            // Determine which token to use based on even/odd index
            const currentToken = (i % 2 === 0) ? token : token2;
            await request(app)
                .post('/api/items')
                .set('Authorization', `Bearer ${currentToken}`)
                .send(TEST_ITEMS[i]);
        }

        const itemRes = await db.query(
            'SELECT id FROM items WHERE title = $1 LIMIT 1', 
            [TEST_ITEMS[0].title]
        );
        const validId = itemRes.rows[0].id;

        const res = await request(app)
            .delete(`/api/items/${validId}`)
            .set('Authorization', `Bearer ${token}`);



        const response = await request(app)
            .get('/api/items')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        // We want to see User 1's items AND User 2's items in the same list
        const titles = response.body.map(item => item.title);
        
        expect(titles).toContain(TEST_ITEMS[2].title); // User 1's item
        expect(titles).toContain(TEST_ITEMS[1].title); // User 2's item
        
        // It should NOT return items that were canceled in previous tests
        const statuses = response.body.map(item => item.status);
        expect(statuses).not.toContain('canceled');
    });

    test('NEGATIVE: Should return empty array if no active items exist', async () => {
        // First, wipe the items table for this specific test
        await db.query('DELETE FROM items');

        const response = await request(app)
            .get('/api/items')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });
});
    
    



