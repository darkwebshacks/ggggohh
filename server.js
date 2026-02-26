const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// 🔑 Hugging Face token
const HF_TOKEN = process.env.HF_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🤖 AI PREDICTION ENDPOINT
app.post("/predict", async (req, res) => {
  try {
    const { match } = req.body;

    if (!match) {
      return res.status(400).json({ error: "Match is required" });
    }

    const prompt = `
Predict the most likely correct score (CS) for the football match.
Only return ONE score in format X-Y.

Match: ${match}
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const data = await response.json();

    const prediction =
      data?.[0]?.generated_text || "Prediction unavailable";

    res.json({ prediction });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI prediction failed" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
