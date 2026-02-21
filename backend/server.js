
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const MonkMode = require("./models/MonkMode");

const app = express();

app.use(cors());
app.use(express.json());

// Add new rule
app.post("/add-rule", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.json({ success: true, skipped: true });
    }
    const doc = await MonkMode.findOne();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    doc.rules = doc.rules || [];
    doc.rules.push({ text, createdAt: new Date() });
    await doc.save();
    res.json({ success: true, rules: doc.rules });
  } catch (err) {
    console.error("Add rule failed:", err);
    res.status(500).send(err);
  }
});

mongoose.connect("mongodb+srv://monkmode:Aravindh%406301906805@monkmode.b5q3gny.mongodb.net/monkmode?appName=monkmode")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
    res.send("MonkMode backend running 🚀");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

// Save today's data
app.post("/save", async (req, res) => {
  try {
    const { currentDate, today, history } = req.body;

    const updated = await MonkMode.findOneAndUpdate(
      {}, // empty filter → always target first document
      { currentDate, today, history },
      { new: true, upsert: true } // create if not exists
    );

    res.json(updated);
  } catch (err) {
    res.status(500).send(err);
  }
});


// Get saved data
app.get("/data", async (req, res) => {
  try {
    const data = await MonkMode.findOne();
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({
      currentDate: data.currentDate,
      today: data.today,
      history: data.history,
      logs: data.logs || {},
      rules: data.rules || []
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Save daily log
app.post("/save-log", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { date, text } = req.body;
    if (!date || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    if (!text || text.trim() === "") {
      return res.json({ success: true, skipped: true });
    }
    // Ensure logs object exists
    const doc = await MonkMode.findOne();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.logs) doc.logs = {};
    // Use $set to update logs.<date>
    const updated = await MonkMode.findOneAndUpdate(
      {},
      { $set: { [`logs.${date}`]: text } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).send(err);
  }
});

