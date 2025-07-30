const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function chatWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // or gemini-1.5-flash
  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(prompt);
  const response = result.response.text().trim();
  return response;
}

module.exports = { chatWithGemini };
