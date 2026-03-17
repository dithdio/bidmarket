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
    describe('get /api/buyableItems', () => {
        test('POSITIVE: Should return items that each user can buy', async () => {
            const res1 = await request(app)
            .get('/api/buyableItems')
            .set('Authorization', `Bearer ${token}`);

            const res2 = await request(app)
            .get('/api/buyableItems')
            .set('Authorization', `Bearer ${token2}`);

        })
        
            

    });
    
    // get all items a user is selling 
    describe('get /api/listedItems', () => {
    });
});


