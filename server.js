const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB connection
const uri = "mongodb://aishmg07:15540@ac-lzxn54e-shard-00-00.j6ewujf.mongodb.net:27017,ac-lzxn54e-shard-00-01.j6ewujf.mongodb.net:27017,ac-lzxn54e-shard-00-02.j6ewujf.mongodb.net:27017/?ssl=true&replicaSet=atlas-12cpi6-shard-0&authSource=admin&appName=Wear-stock";  // 🔴 paste your MongoDB Atlas URL here
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("wear-stock");
        console.log("MongoDB Connected ✅");
    } catch (err) {
        console.log("DB Error ❌", err);
    }
}

function getDB() {
    return db;
}

// ✅ START DB
connectDB();

// ---------------- ROOT ----------------
app.get("/", (req, res) => {
    res.send("Server is running ✅");
});

// ---------------- AUTO ID ----------------
async function getNextSequence(name) {
    const result = await db.collection("counters").findOneAndUpdate(
        { _id: name },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after", upsert: true }
    );
    return result.value.sequence_value;
}

// ---------------- AUTH ----------------

// Register
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        await db.collection("users").insertOne({
            username,
            email,
            password
        });

        res.json({ message: "User Registered ✅" });
    } catch {
        res.json({ error: "Registration failed ❌" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await db.collection("users")
            .findOne({ username, password });

        res.json({ success: !!user });
    } catch {
        res.json({ error: "Login error ❌" });
    }
});

// ---------------- ITEMS ----------------

// Add Item
app.post("/add-item", async (req, res) => {
    try {
        const db = getDB();

        console.log("BODY:", req.body); // 🔥 important

        const id = await getNextSequence("itemId");

        await db.collection("items").insertOne({
            id: id,
            name: req.body.name,
            category: req.body.category,
            size: req.body.size,
            qty: Number(req.body.qty)
        });

        res.json({ message: "Item Added ✅" });

    } catch (err) {
        console.log("ERROR:", err);
        res.json({ error: "Add failed ❌" });
    }
});

// Get Items
app.get("/items", async (req, res) => {
    const items = await db.collection("items").find().toArray();
    res.json(items);
});

// Update
app.put("/update-item/:id", async (req, res) => {
    const { name, category, size, qty } = req.body;

    await db.collection("items").updateOne(
        { id: Number(req.params.id) },
        { $set: { name, category, size, qty: Number(qty) } }
    );

    res.json({ message: "Updated ✅" });
});

// Delete
app.delete("/delete-item/:id", async (req, res) => {
    await db.collection("items").deleteOne({
        id: Number(req.params.id)
    });

    res.json({ message: "Deleted ✅" });
});

// ---------------- DASHBOARD ----------------
app.get("/summary", async (req, res) => {
    const items = await db.collection("items").find().toArray();

    let total = items.length;
    let low = 0;
    let out = 0;
    let categories = new Set();

    items.forEach(i => {
        categories.add(i.category);

        if (i.qty === 0) out++;
        else if (i.qty <= 5) low++;
    });

    res.json({
        total,
        low,
        out,
        categories: categories.size
    });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});