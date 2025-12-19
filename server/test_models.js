import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const run = async () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
      console.log("No API Key found");
      return;
  }
  
  try {
      console.log("Listing models via HTTP...");
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      console.log("Available Models:");
      response.data.models
        .filter(m => m.name.includes('flash'))
        .forEach(m => console.log(`- ${m.name}`));
  } catch (error) {
      console.error("HTTP List Failed:", error.response ? error.response.data : error.message);
  }
};

run();
