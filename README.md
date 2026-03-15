# bidmarket
marketplace which allows users to sell items and place bids

npm install --save-dev jest supertest

## 🗄️ Database Schema

- **users**: id, username, email, password (hashed), balance
- **items**: id, title, description, starting_price, current_price, status (enum), seller_id, end_time
- **bids**: id, item_id, bidder_id, amount, created_at
- **watchlist**: user_id, item_id

## 🛠️ Development Roadmap

- [x] Initialize Supabase Database
- [x] Create `schema.sql` and `initDb.js`
- [ ] Implement User Registration (Bcrypt hashing)
- [ ] Implement JWT Authentication
- [ ] Create CRUD APIs and Testing for all tables
    - [ ] Users
    - [ ] Items
    - [ ] Bids
    - [ ] Watchlist
- [ ] Real-time Bidding Logic (Validation: bid must be > current_price)


