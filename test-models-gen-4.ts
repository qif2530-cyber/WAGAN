import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ role: 'user', parts: [{ text: "a beautiful cat" }] }],
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" } as any
      }
    });
    console.log("gemini-3.1-flash-image-preview Success");
  } catch(e: any) {
    if (e.response && e.response.status) {
      console.error(JSON.stringify(e.response.data));
    } else {
      console.error("gemini-3.1-flash-image-preview Error:", e.message);
    }
  }
}
run();
