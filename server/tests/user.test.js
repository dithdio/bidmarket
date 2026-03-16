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

    test('It should fail if the email is already taken', async () => {
        // 1. MANUALLY CREATE the user first so we KNOW they exist
        // We call the DB directly here to set the "stage"
        await request(app).post('/api/users/register').send(TEST_USER);

        // 2. NOW try to register them again
        const response = await request(app)
            .post('/api/users/register')
            .send(TEST_USER);

        expect(response.statusCode).toBe(400); 
        expect(response.body.error).toMatch(/exists/i);
    });

    test('It should register a new user and return 201', async () => {
        // 1. Ensure the user doesn't exist before we start
        await db.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);

        const response = await request(app)
            .post('/api/users/register')
            .send(TEST_USER);

        expect(response.statusCode).toBe(201);
        expect(response.body.email).toBe(TEST_USER.email);

        expect(response.body).toHaveProperty('token');
        expect(response.body).not.toHaveProperty('password');
    });
    

    test.each(['username', 'email', 'password'])(
        'It should fail if %s is missing', 
        async (field) => {
            // 1. Start with a perfectly valid user
            const userData = {
                username: 'clean_tester',
                email: 'clean@test.com',
                password: 'password123'
            };
    
            // 2. Remove the specific field we are testing
            delete userData[field];
    
            // 3. Send the request
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);
    
                expect(response.statusCode).toBe(400); 
                expect(response.body).toHaveProperty('error'); 
                expect(response.body).not.toHaveProperty('token');    
        }
    );

    test('It should fail if the username is 3 or less characters', async () => {
        const shortUsernameUser = {
            username: 'abc', 
            email: 'short@test.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/users/register')
            .send(shortUsernameUser);

            expect(response.statusCode).toBe(400); 
            expect(response.body).toHaveProperty('error'); 
            expect(response.body).not.toHaveProperty('token');
    });

    test('It should fail if the password is 3 or less characters', async () => {
        const shortPasswordUser = {
            username: 'validUser',
            email: 'shortpass@test.com',
            password: '123' 
        };

        const response = await request(app)
            .post('/api/users/register')
            .send(shortPasswordUser);

            expect(response.statusCode).toBe(400); 
            expect(response.body).toHaveProperty('error'); 
            expect(response.body).not.toHaveProperty('token');
    });

    test('It should fail if the email is not a valid format', async () => {
        const invalidEmailUser = {
            username: 'validUser',
            email: 'this-is-not-an-email',
            password: 'password123'
        };
    
        const response = await request(app)
            .post('/api/users/register')
            .send(invalidEmailUser);
    
            expect(response.statusCode).toBe(400); 
            expect(response.body).toHaveProperty('error'); 
            expect(response.body).not.toHaveProperty('token');
    });

    describe('POST /api/users/login', () => {
        const LOGIN_USER = {
            username: 'logintest',
            email: 'login@test.com',
            password: 'password123'
        };

        // Before we test login, we need a user to exist in the DB
        beforeAll(async () => {
            await request(app)
                .post('/api/users/register')
                .send(LOGIN_USER);
        });

        test('It should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: LOGIN_USER.email,
                    password: LOGIN_USER.password
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', LOGIN_USER.email);
            expect(response.body.user).not.toHaveProperty('password');
        });

        test('It should fail with an incorrect password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: LOGIN_USER.email,
                    password: 'wrongpassword'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBeDefined();
        });

        test('It should fail if the user does not exist', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'fakeuser@test.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(401);
        });
    });


});