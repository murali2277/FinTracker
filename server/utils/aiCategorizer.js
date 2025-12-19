import { GoogleGenerativeAI } from "@google/generative-ai";
import Transaction from '../models/Transaction.js';

export const categorizeWithAI = async (userId, title, amount) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY missing");
      return "Uncategorized";
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use confirmed available model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" }); 

    const history = await Transaction.find({
      user: userId,
      category: { $ne: "Uncategorized" },
    })
      .sort({ date: -1 })
      .limit(10)
      .select("title category");

    const examples =
      history.length > 0
        ? history
            .map((t) => `Input: "${t.title}" -> Category: ${t.category}`)
            .join("\n")
        : "Input: \"Zomato Order\" -> Category: Food\nInput: \"Uber Ride\" -> Category: Transport";

    const prompt = `
You are a financial assistant. Categorize the transaction into one of these buckets:
[Food, Transport, Utilities, Entertainment, Health, Education, Shopping, Rent, Others]

Strict Rules:
- Return ONLY the category name. No sentences.
- Learn from the user's past examples below.

User's Past Examples (Pattern to follow):
${examples}

New Transaction:
Input: "${title}" (Amount: ${amount})
Category:
`;

    console.log(`🤖 AI Processing: "${title}"...`);

    // Newer SDK syntax often prefers object form. 
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const response = await result.response;
    const text = response.text().trim();

    console.log(`✅ AI Categorized: "${title}" -> ${text}`);
    return text || "Others";
  } catch (error) {
    console.error("❌ AI FAILURE:", error.message);
    if (error.message && error.message.includes("API_KEY")) {
      return "Uncategorized";
    }
    return "Others";
  }
};
