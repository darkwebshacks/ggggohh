// server.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 8080;

// GROQ API
const GROQ_KEY = process.env.GROQ_KEY; // set this in your .env
const GROQ_URL = "https://api.groq.ai/v1/engines/football-score/infer";

// JSON file for matches
const MATCHES_FILE = path.join(__dirname, "matches.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Load/save matches
function loadMatches() {
  if (!fs.existsSync(MATCHES_FILE)) return [];
  const data = fs.readFileSync(MATCHES_FILE, "utf8");
  try { return JSON.parse(data); } catch { return []; }
}
function saveMatches(matches) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
}

// Serve frontend
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/matches", (req, res) => res.json(loadMatches()));

// AI prediction endpoint using GROQ
app.post("/predict", async (req, res) => {
  const { match } = req.body;
  if (!match) return res.status(400).json({ error: "Match is required" });

  const prompt = `Predict the most likely correct score for this football match. Return only one score in X-Y format.\nMatch: ${match}`;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const text = await groqRes.text(); // Groq returns plain text
    console.log("Groq raw output:", text);

    // Extract X-Y score from text
    const scoreMatch = text.match(/(\d)\s*[-–:]\s*(\d)/);
    const score = scoreMatch ? `${scoreMatch[1]}-${scoreMatch[2]}` : "N/A";

    res.json({ match, prediction: score });
  } catch (err) {
    console.error("Predict error:", err.message);
    res.json({ match, prediction: "N/A" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
