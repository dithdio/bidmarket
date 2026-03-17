const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Get the token from the header (format: Bearer <token>)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // 3. Add the user info from the payload to the request object
        req.user = decoded; 
        
        // 4. Move to the next function (the actual route)
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = auth;