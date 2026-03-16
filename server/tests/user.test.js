const request = require('supertest');
const app = require('../index');
const db = require('../db/db');

const TEST_USER = {
    username: 'api_tester',
    email: 'api@test.com',
    password: 'password123'
};

const cleanup = async () => {
    await db.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);
};

// Before each individual test: Start with a clean slate
beforeEach(async () => {
    await cleanup();
});

// After the whole file is done: Clean up the mess and close the connection
afterAll(async () => {
    await cleanup(); // Final wipe
    await db.pool.end(); // Essential for Jest to exit
});

describe('POST /api/users/register', () => {

    test('It should register a new user and return 201', async () => {
        // 1. Ensure the user doesn't exist before we start
        await db.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);

        const response = await request(app)
            .post('/api/users/register')
            .send(TEST_USER);

        expect(response.statusCode).toBe(201);
        expect(response.body.email).toBe(TEST_USER.email);
    });

    test('It should fail if the email is already taken', async () => {
        // 1. MANUALLY CREATE the user first so we KNOW they exist
        // We call the DB directly here to set the "stage"
        await db.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]); 
        await request(app).post('/api/users/register').send(TEST_USER);

        // 2. NOW try to register them again
        const response = await request(app)
            .post('/api/users/register')
            .send(TEST_USER);

        expect(response.statusCode).toBe(400); 
        expect(response.body.error).toMatch(/exists/i);xw
    });
});