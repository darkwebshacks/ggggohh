// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

// -------------------- Setup --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Hugging Face API token
const HF_TOKEN = process.env.HF_TOKEN;

// Admin password (set in Render Environment Variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret123";

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// -------------------- Serve Frontend --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// -------------------- Prediction Endpoint --------------------
app.post("/predict", async (req, res) => {
  try {
    const { match } = req.body;
    if (!match) return res.status(400).json({ error: "Match is required" });

    const prompt = `
Predict the most likely correct score (CS) for this football match.
Only return one score in format X-Y.

Match: ${match}
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2", // Replace with your HF model
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const data = await response.json();
    res.json({ prediction: data });
  } catch (err) {
    res.status(500).json({ error: "Prediction failed", details: err.message });
  }
});

// -------------------- Admin Routes --------------------
// Add a new match (admin only)
app.post("/admin/add-match", (req, res) => {
  const { password, match, date } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!match || !date) {
    return res.status(400).json({ error: "Match and date are required" });
  }

  if (!global.matches) global.matches = [];
  global.matches.push({ match, date });

  res.json({ success: true, matches: global.matches });
});

// Get all matches (admin only)
app.get("/admin/matches", (req, res) => {
  const password = req.query.password;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  res.json(global.matches || []);
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
