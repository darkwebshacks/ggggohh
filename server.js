import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ------------------ FIX __dirname FOR ES MODULE ------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------ CONFIG ------------------ */
const app = express();
const PORT = process.env.PORT || 8080;

const HF_URL =
  "https://router.huggingface.co/hf-inference/models/google/flan-t5-small";

const HF_TOKEN = process.env.HF_TOKEN; // set in .env or Render

const MATCHES_FILE = path.join(__dirname, "matches.json");

/* ------------------ MIDDLEWARE ------------------ */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* ------------------ MATCH STORAGE ------------------ */
function loadMatches() {
  if (!fs.existsSync(MATCHES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MATCHES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMatches(matches) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
}

/* ------------------ ROUTES ------------------ */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/matches", (req, res) => {
  res.json(loadMatches());
});

/* ------------------ AI PREDICTION ------------------ */
app.post("/predict", async (req, res) => {
  try {
    const { match } = req.body;
    if (!match) {
      return res.status(400).json({ error: "Match is required" });
    }

    const prompt = `
Predict the most likely football correct score.
Return ONLY one score in format X-Y.

Match: ${match}
`;

    const hfRes = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 10 },
      }),
    });

    const rawText = await hfRes.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("HF raw response:", rawText);
      return res.json({ match, prediction: "N/A" });
    }

    const generated =
      data?.[0]?.generated_text ||
      data?.generated_text ||
      "";

    const scoreMatch = generated.match(/\b\d-\d\b/);
    const score = scoreMatch ? scoreMatch[0] : "N/A";

    res.json({ match, prediction: score });

  } catch (err) {
    console.error("Predict error:", err.message);
    res.json({ match: req.body?.match, prediction: "N/A" });
  }
});

/* ------------------ START SERVER ------------------ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
