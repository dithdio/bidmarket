const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Import  route files
const userRoutes = require('./routes/user');
const itemRoutes = require('./routes/item')

// Middleware
app.use(cors()); 
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);

// Basic Test Route
app.get('/', (req, res) => {
    res.send('🚀 BidMarket 2.0 API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;