/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const getWordDetails = async (word: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a GRE-level definition, synonyms, and an example sentence for the word: "${word}". Return the response in JSON format with keys: definition, synonyms (array), example.`,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching word details:", error);
    return null;
  }
};

export const chatWithTutor = async (message: string, history: { role: string; content: string }[]) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are a GRE expert tutor. Help the user with vocabulary, math, or verbal reasoning. Be concise and encouraging.",
      },
    });

    // Note: The SDK might handle history differently, but for simplicity:
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error in AI Tutor chat:", error);
    return "I'm sorry, I'm having trouble connecting right now.";
  }
};
