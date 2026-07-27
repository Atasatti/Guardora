import { GoogleGenAI } from "@google/genai";

export const checkContentSafety = async (text, type) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        isSafe: true,
        flaggedCategory: "None",
        reason: "AI moderation is not configured",
        confidence: "Low",
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are a content moderation AI for a residential community app. 
      Analyze the following ${type} content for: Hate Speech, Harassment, Violence, Illegal Goods (Drugs/Weapons), or Scams.
      
      Content to analyze: "${text}"

      RESPOND ONLY with a JSON object in this exact format (no markdown code blocks):
      {
        "isSafe": boolean,
        "flaggedCategory": "string (e.g., Hate Speech, Violence, None)",
        "reason": "short explanation",
        "confidence": "High/Medium/Low"
      }
    `;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });
    const textResponse = response.text;

    // Clean up markdown if Gemini adds it (e.g., ```json ... ```)
    const cleanedText = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI Moderation Error:", error);
    // Default to safe if AI fails, or handle differently depending on policy
    return { isSafe: true, reason: "AI Error" };
  }
};
