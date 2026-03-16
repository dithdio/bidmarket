const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser } = require('../models/user');

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
        const salt = await bcrypt.genSalt(10);
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

module.exports = router;