const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connectDB, getDB } = require("./db");
const { ObjectId } = require("mongodb");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect database
connectDB();


// ================== AUTH ==================

// Register
app.post("/register", async (req, res) => {
    try {
        const db = getDB();
        const { username, email, password } = req.body;

        await db.collection("users").insertOne({
            username,
            email,
            password
        });

        res.json({ message: "User Registered ✅" });

    } catch (err) {
        res.json({ error: "Registration failed ❌" });
    }
});


// Login
app.post("/login", async (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body;

        const user = await db.collection("users")
            .findOne({ username, password });

        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }

    } catch (err) {
        res.json({ error: "Login error ❌" });
    }
});


// ================== ITEMS ==================

// Add Item
app.post("/add-item", async (req, res) => {
    try {
        const db = getDB();

        await db.collection("items").insertOne(req.body);

        res.json({ message: "Item Added ✅" });

    } catch (err) {
        res.json({ error: "Add failed ❌" });
    }
});


// Get Items
app.get("/items", async (req, res) => {
    try {
        const db = getDB();

        const items = await db.collection("items")
            .find()
            .toArray();

        res.json(items);

    } catch (err) {
        res.json({ error: "Fetch failed ❌" });
    }
});


// Update Item
app.put("/update-item/:id", async (req, res) => {
    try {
        const db = getDB();

        await db.collection("items").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        res.json({ message: "Item Updated ✅" });

    } catch (err) {
        res.json({ error: "Update failed ❌" });
    }
});


// Delete Item
app.delete("/delete-item/:id", async (req, res) => {
    try {
        const db = getDB();

        await db.collection("items").deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.json({ message: "Item Deleted ✅" });

    } catch (err) {
        res.json({ error: "Delete failed ❌" });
    }
});
// Summary data
app.get("/summary", async (req, res) => {
    const db = getDB();
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
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000 🚀");
});