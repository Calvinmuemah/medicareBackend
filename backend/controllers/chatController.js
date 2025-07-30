const { chatWithGemini } = require("../services/geminiServiceChat");

exports.handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const reply = await chatWithGemini(message);
    res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini chatbot error:", error.message);
    res.status(500).json({ error: "Gemini chatbot failed" });
  }
};
