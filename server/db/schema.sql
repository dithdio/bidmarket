-- To reset your DB, uncomment the lines below:
DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Items Status Enum (with safety check)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('active', 'sold', 'expired', 'canceled');
    END IF;
END $$;

-- 3. Items Table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    description VARCHAR(1000),
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    status item_status DEFAULT 'active',
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bids Table
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    bidder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id)
);