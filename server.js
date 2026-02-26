const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = 8080;

// 🔑 PUT YOUR HUGGING FACE API KEY HERE
const HF_TOKEN = process.env.HF_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🧠 REAL AI PREDICTION ENDPOINT
app.post("/predict", async (req, res) => {
  try {
    const { match } = req.body;
    if (!match) {
      return res.status(400).json({ error: "Match is required" });
    }

    // Prompt for AI (Correct Score only)
    const prompt = `
Predict the most likely correct score (CS) for this football match.
Only return one score in format X-Y.

Match: ${match}
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 10,
            temperature: 0.2
          }
        })
      }
    );

    const data = await response.json();

    // Extract AI text safely
    const text =
      data?.[0]?.generated_text ||
      data?.generated_text ||
      "1-1";

    // Find score like 2-1, 3-0, etc
    const scoreMatch = text.match(/\b\d-\d\b/);
    const score = scoreMatch ? scoreMatch[0] : "1-1";

    res.json({
      match,
      correct_score: score
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI prediction failed" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
