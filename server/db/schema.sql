-- To reset your DB, uncomment the lines below:
-- DROP TABLE IF EXISTS watchlist;
-- DROP TABLE IF EXISTS bids;
-- DROP TABLE IF EXISTS items;
-- DROP TABLE IF EXISTS users;

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- STORE HASHED PASSWORDS ONLY
    balance DECIMAL(10,2) DEFAULT 0.00
);

-- 2. Items

CREATE TYPE item_status AS ENUM ('active', 'sold', 'expired', 'canceled');


CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    status item_status DEFAULT 'active',
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bids
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    bidder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

    PRIMARY KEY (user_id, item_id)
);