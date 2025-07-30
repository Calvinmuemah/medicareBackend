const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function predictRisk(ecg, temperature, heartRate) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `...`; // your prompt

  const chat = model.startChat();

  let attempts = 3;
  while (attempts--) {
    try {
      const result = await chat.sendMessage(prompt);
      return result.response.text().toLowerCase().trim();
    } catch (err) {
      if (err.status === 503 && attempts > 0) {
        console.warn("🔁 Gemini model overloaded, retrying...");
        await new Promise((res) => setTimeout(res, 3000)); // wait 3 seconds
        continue;
      }
      throw err;
    }
  }
}
module.exports = { predictRisk };
