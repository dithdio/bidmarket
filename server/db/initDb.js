const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initializeDatabase() {
    try {
        // Read the SQL file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log("⏳ Initializing database...");
        
        // Execute the SQL
        await db.query(schema);
        
        console.log("✅ All tables created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error initializing database:", err);
        process.exit(1);
    }
}

initializeDatabase();