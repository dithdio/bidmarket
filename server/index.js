const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors()); 
app.use(express.json());

// Basic Test Route
app.get('/', (req, res) => {
    res.send('🚀 BidMarket 2.0 API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});