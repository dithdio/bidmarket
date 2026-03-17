const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById} = require('../models/user');
const auth = require('../middleware/auth');

// POST /api/users/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Validation: Missing fields
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // 2. Validation: Length checks
        if (username.length <= 3) {
            return res.status(400).json({ error: "Username must be more than 3 characters" });
        }
        if (password.length <= 3) {
            return res.status(400).json({ error: "Password must be more than 3 characters" });
        }

        // 3. Validation: Basic Email Format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // 4. Hash the password
        const salt = await bcrypt.genSalt(5);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Save to DB using your Model
        const newUser = await createUser(username, email, hashedPassword);

        // 6. Generate JWT Token
        const token = jwt.sign(
            { id: newUser.id }, 
            process.env.JWT_SECRET || 'fallback_secret', // Always use .env in production!
            { expiresIn: '24h' }
        );

        // 7. Response (Excluding the password for security)
        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            token: token
        });

    } catch (err) {
        // Handle Postgres Duplicate Key Error (Unique Constraint)
        if (err.code === '23505') {
            return res.status(400).json({ error: "User already exists with this email or username" });
        }
        
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation: Ensure fields are present
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 2. READ: Look for the user
        const user = await findUserByEmail(email);
        
        // 3. CHECK: Does the user exist?
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. VERIFY: Compare password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 5. SIGN: Create a JWT
        // Use a secret key from your .env file
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret', // Make sure to add JWT_SECRET to .env
            { expiresIn: '1h' }
        );

        // 6. RESPOND: Send token and user (minus password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/me 
// gets user data for front end based on user id
router.get('/me', auth, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;