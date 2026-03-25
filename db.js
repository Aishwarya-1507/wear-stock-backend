const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        if (db) return db; // Return existing connection if already connected
        
        await client.connect();
        db = client.db("wearstock");
        console.log("MongoDB Connected ✅");
        return db;
    } catch (err) {
        console.error("DB Error ❌", err);
        process.exit(1); // Stop the server if DB fails
    }
}

// Function to get the current DB instance
function getDB() {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
}

// Sequence Generator for IDs
async function getNextSequence(name) {
    const database = getDB();
    const result = await database.collection("counters").findOneAndUpdate(
        { _id: name },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after", upsert: true }
    );
    
    // Fix for driver version differences
    const doc = result.value || result;
    return doc.sequence_value;
}

module.exports = { connectDB, getDB, getNextSequence };