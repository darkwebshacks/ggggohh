// server.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 8080;

// Admin password (change this!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yourStrongPassword";

// JSON file to store matches
const MATCHES_FILE = path.join(__dirname, "matches.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper: load matches
function loadMatches() {
  if (!fs.existsSync(MATCHES_FILE)) return [];
  const data = fs.readFileSync(MATCHES_FILE, "utf8");
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Helper: save matches
function saveMatches(matches) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
}

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Admin login endpoint
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid password" });
  }
});

// Add match (Admin only)
app.post("/admin/add-match", (req, res) => {
  const { password, teamA, teamB, date, prediction, odds } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const matches = loadMatches();
  matches.push({
    id: Date.now(),
    teamA,
    teamB,
    date,
    prediction,
    odds,
    status: "pending"
  });
  saveMatches(matches);
  res.json({ success: true, match: matches[matches.length - 1] });
});

// Get all matches (Admin + public)
app.get("/matches", (req, res) => {
  const matches = loadMatches();
  res.json(matches);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
