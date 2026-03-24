const { MongoClient } = require("mongodb");
require("dotenv").config();

// Get URL from .env
const url = process.env.MONGO_URL;

// Create client (with proper options)
const client = new MongoClient(url);

let db;

// Connect to MongoDB Atlas
async function connectDB() {
    try {
        await client.connect();
        console.log("MongoDB Atlas Connected ✅");

        db = client.db("wearstock");

    } catch (error) {
        console.error("MongoDB Connection Failed ❌", error);
    }
}

// Export DB
function getDB() {
    return db;
}

module.exports = { connectDB, getDB };