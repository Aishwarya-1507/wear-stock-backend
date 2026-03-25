const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectDB, getDB } = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("server is running");
});
// Connect database
connectDB();

// ---------------- HELPER: auto-increment ID ----------------
async function getNextSequence(name) {
    const db = getDB();
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
        const db = getDB();
        const { username, email, password } = req.body;

        // STRONG PASSWORD CHECK
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!strongPassword.test(password)) {
            return res.json({ error: "Weak password ❌" });
        }

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

        const user = await db.collection("users").findOne({ username, password });
        res.json({ success: !!user });

    } catch (err) {
        res.json({ error: "Login error ❌" });
    }
});

// ---------------- ITEMS ----------------

// Add Item
app.post("/add-item", async (req, res) => {
    try {
        const db = getDB();
        const { name, category, size, qty } = req.body;

        const id = await getNextSequence("itemId"); // auto-increment ID

        await db.collection("items").insertOne({
            id,
            name,
            category,
            size,
            qty: Number(qty)
        });

        res.json({ message: "Item Added ✅", id });

    } catch (err) {
        console.log(err);
        res.json({ error: "Add failed ❌" });
    }
});

// Get Items
app.get("/item", async (req, res) => {
    try {
        const db = getDB();
        const items = await db.collection("items").find().toArray();
        res.json(items);
    } catch (err) {
        res.json({ error: "Fetch failed ❌" });
    }
});

// Update Item
app.put("/update-item/:id", async (req, res) => {
    try {
        const db = getDB();
        const { name, category, size, qty } = req.body;

        await db.collection("items").updateOne(
            { id: Number(req.params.id) },
            { $set: { name, category, size, qty: Number(qty) } }
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
        await db.collection("items").deleteOne({ id: Number(req.params.id) });
        res.json({ message: "Item Deleted ✅" });
    } catch (err) {
        res.json({ error: "Delete failed ❌" });
    }
});

// ---------------- DASHBOARD / REPORTS ----------------
app.get("/summary", async (req, res) => {
    try {
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

    } catch (err) {
        res.json({ error: "Summary fetch failed ❌" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));