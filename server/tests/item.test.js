const request = require('supertest');
const app = require('../index');
const db = require('../db/db');

const TEST_USER = {
    username: 'api_tester',
    email: 'api@test.com',
    password: 'password123'
};

const TEST_ITEM = {
    title: 'This is a title', 
    description: 'this is a valid d3scription !!!',
    starting_price: 33.00,
}

const cleanup = async () => {
    await db.query('DELETE FROM items WHERE title = $1', [TEST_ITEM.title]);
};

beforeAll(async () => {
    await request(app)
        .post('/api/users/register')
        .send(LOGIN_USER);
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

    });

    test.each(['title', 'starting_price'])(
        'It should fail if %s is missing', 
        async (field) => {
   
        }
    );

    test('NEGATIVE: Should fail if the token is invalid', async () => {

    });


    test('NEGATIVE: Should fail if the title is too short', async () => {

    });

    test('NEGATIVE: Should fail if the title is too long', async () => {

    });

    test('NEGATIVE: Should fail if the description is too short', async () => {

    });

    test('NEGATIVE: Should fail if the title is too long', async () => {

    });


});