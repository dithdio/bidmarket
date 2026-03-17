const request = require('supertest');
const app = require('../index');
const db = require('../db/db');

let token; 

const TEST_USER = {
    username: 'api_tester',
    email: 'api@test.com',
    password: 'password123'
};

const TEST_ITEM = {
    title: 'This is a title', 
    description: 'this is a valid d3scription !!!',
    starting_price: 33.00,
    end_time: '2026-12-31T23:59:59Z'
}

const cleanup = async () => {
    await db.query('DELETE FROM items WHERE title = $1', [TEST_ITEM.title]);
};

beforeAll(async () => {
    const regRes = await request(app)
        .post('/api/users/register')
        .send(TEST_USER);
    token = regRes.body.token;
});

// Before each individual test: Start with a clean slate
beforeEach(async () => {
    await cleanup();
});

// After the whole file is done: Clean up the mess and close the connection
afterAll(async () => {
    await cleanup(); // Final wipe
    await db.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);
    await db.pool.end(); // Essential for Jest to exit
});

describe('POST /api/items', () => {
    test('SUCCESS: Should return newly created item', async () => {
        const response = await request(app)
            .post('/api/items')
            .set('Authorization', `Bearer ${token}`)
            .send(TEST_ITEM);;
        
        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe(TEST_ITEM.title);
        expect(response.body).toHaveProperty('created_at');
    });


    test.each(['title', 'starting_price', 'end_time'])(
        'It should fail if %s is missing', 
        async (field) => {
            // 1. Start with a perfectly valid item
            const sampleItem = { ...TEST_ITEM };
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
            .send(TEST_ITEM);
        expect(response.statusCode).toBe(401);
    });

    test('NEGATIVE: Should fail if no token is provided', async () => {
        const response = await request(app).post('/api/items')
        .send(TEST_ITEM);
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