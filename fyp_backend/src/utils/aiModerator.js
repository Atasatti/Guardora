import { GoogleGenAI } from "@google/genai";

const OLLAMA_CATEGORIES = [
  ["violence", "Violence"],
  ["social_bias", "Hate Speech / Social Bias"],
  ["profanity", "Harassment / Profanity"],
  ["sexual_content", "Sexual Content"],
  ["unethical_behavior", "Illegal or Unethical Behavior"],
];

const cleanInput = (text) => String(text || "").trim().slice(0, 8000);

const ollamaJudge = async (text, category) => {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(
    /\/+$/,
    ""
  );
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(
      Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || "30000", 10)
    ),
    body: JSON.stringify({
      model: process.env.OLLAMA_MODERATION_MODEL || "granite3-guardian:2b",
      messages: [
        { role: "system", content: category },
        { role: "user", content: text },
      ],
      stream: false,
      options: { temperature: 0, num_predict: 4 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const result = await response.json();
  const verdict = String(result?.message?.content || "")
    .trim()
    .toLowerCase();

  if (!/^(yes|no)\b/.test(verdict)) {
    throw new Error(`Unexpected Granite Guardian verdict: ${verdict || "empty"}`);
  }

  return verdict.startsWith("yes");
};

const moderateWithOllama = async (text, type) => {
  const isHarmful = await ollamaJudge(text, "harm");
  if (!isHarmful) {
    return {
      isSafe: true,
      flaggedCategory: "None",
      reason: `${type} passed local Granite Guardian screening`,
      confidence: "High",
      provider: "ollama",
    };
  }

  const categoryResults = await Promise.allSettled(
    OLLAMA_CATEGORIES.map(async ([risk, label]) => ({
      label,
      flagged: await ollamaJudge(text, risk),
    }))
  );
  const matched = categoryResults.find(
    (result) => result.status === "fulfilled" && result.value.flagged
  );
  const flaggedCategory =
    matched?.status === "fulfilled" ? matched.value.label : "General Harm";

  return {
    isSafe: false,
    flaggedCategory,
    reason: `${type} contains content flagged by local Granite Guardian`,
    confidence: matched ? "High" : "Medium",
    provider: "ollama",
  };
};

const moderateWithGemini = async (text, type) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
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

  const cleanedText = textResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return { ...JSON.parse(cleanedText), provider: "gemini" };
};

export const checkContentSafety = async (text, type = "Content") => {
  const content = cleanInput(text);
  if (!content) {
    return {
      isSafe: true,
      flaggedCategory: "None",
      reason: "No text to moderate",
      confidence: "High",
      provider: "none",
    };
  }

  const preferredProvider = (
    process.env.MODERATION_PROVIDER || "ollama"
  ).toLowerCase();
  const providers =
    preferredProvider === "gemini"
      ? [moderateWithGemini, moderateWithOllama]
      : [moderateWithOllama, moderateWithGemini];

  const errors = [];
  for (const provider of providers) {
    if (provider === moderateWithGemini && !process.env.GEMINI_API_KEY) continue;

    try {
      return await provider(content, type);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  console.error("AI moderation unavailable:", errors.join("; "));
  return {
    isSafe: true,
    flaggedCategory: "None",
    reason: "Moderation service unavailable; content requires manual review",
    confidence: "Low",
    provider: "unavailable",
  };
};
