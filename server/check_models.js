import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const run = async () => {
    const key = process.env.GEMINI_API_KEY;
    console.log(`\n🔑 Testing API Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}\n`);
    
    if (!key) {
        console.log(`❌ No API key found. Please set GEMINI_API_KEY in server/.env`);
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    // Test models directly - using current model names (Dec 2024+)
    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp", 
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-exp-1206"
    ];

    console.log(`----------------------------------------`);
    console.log(`📡 Testing Gemini API Connection...`);
    console.log(`----------------------------------------\n`);

    for (const modelName of modelsToTest) {
        console.log(`----------------------------------------`);
        console.log(`📡 Testing Model: [ ${modelName} ]`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Hello' in one word");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS! Response: ${text.substring(0, 100)}`);
        } catch (e) {
            console.log(`❌ FAILED`);
            console.log(`   Error: ${e.message}`);
        }
        console.log(`----------------------------------------\n`);
    }

    // Test the exact usage from aiCategorizer.js
    console.log(`========================================`);
    console.log(`🧪 Testing AI Categorization (like aiCategorizer.js)`);
    console.log(`========================================`);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
You are a financial assistant. Categorize the transaction into one of these buckets:
[Food, Transport, Utilities, Entertainment, Health, Education, Shopping, Rent, Others]

Strict Rules:
- Return ONLY the category name. No sentences.

New Transaction:
Input: "Uber Ride to Airport" (Amount: 250)
Category:
`;
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const response = await result.response;
        const category = response.text().trim();
        console.log(`✅ Categorization Test SUCCESS!`);
        console.log(`   Input: "Uber Ride to Airport"`);
        console.log(`   Output: ${category}`);
    } catch (e) {
        console.log(`❌ Categorization Test FAILED`);
        console.log(`   Error: ${e.message}`);
    }
    console.log(`========================================\n`);
};

run();
