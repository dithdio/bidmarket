const db = require('../db/db');

// return the bid object

const findBidbyBidId = async (bidId) => {
    const result = await db.query('SELECT * FROM bids WHERE id = $1', [bidId])
    return result;
}

module.exports = {
    findBidbyBidId
}