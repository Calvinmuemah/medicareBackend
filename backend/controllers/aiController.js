const { predictRisk } = require("../services/geminiService");

exports.handleRiskPrediction = async (req, res) => {
  const { ecg, temperature, heartRate } = req.body;

  if (!ecg || !temperature || !heartRate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const risk = await predictRisk(ecg, temperature, heartRate);
    res.json({ risk });
  } catch (err) {
    console.error("❌ Gemini prediction failed:", err);
    res.status(500).json({ error: "Gemini prediction failed" });
  }
};
