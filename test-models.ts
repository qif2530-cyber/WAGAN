import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const list = await ai.models.list();
    for await (const m of list) {
        if (m.name.includes("image") || m.name.includes("imagen")) {
            console.log(m.name);
        }
    }
  } catch(e) {
    console.error(e);
  }
}
run();
