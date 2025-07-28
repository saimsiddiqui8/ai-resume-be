import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });


export const getOpenAIResponse = async (userMessage) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful chatbot." },
        { role: "user", content: userMessage },
      ],
    });

    return response?.choices[0]?.message?.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new Error("Failed to generate response from OpenAI.");
  }
};
