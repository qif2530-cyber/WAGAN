import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: 'What are the exact parameter types and rules for Kling AI text2video and image2video APIs? Specifically, is `duration` an integer or string? And what are the valid values? Also what are the valid durations for Volcengine Doubao-Seedance 2.0 (Jimeng)?'
  });
  console.log(response.text);
}

main();
