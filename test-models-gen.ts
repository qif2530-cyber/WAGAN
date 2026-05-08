import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ role: 'user', parts: [{ text: "a beautiful cat" }] }],
      config: {
        imageConfig: { aspectRatio: "1:1" } as any
      }
    });
    console.log("gemini-3.1-flash-image-preview Success", response.text?.length);
  } catch(e: any) {
    if (e.response && e.response.status) {
      console.error(JSON.stringify(e.response.data));
    } else {
      console.error("gemini-3.1-flash-image-preview Error:", e.message);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "imagen-4.0-generate-001",
      contents: [{ role: 'user', parts: [{ text: "a beautiful cat" }] }],
      config: {
        imageConfig: { aspectRatio: "1:1" } as any
      }
    });
    console.log("imagen-4.0-generate-001 Success", response);
  } catch(e: any) {
    if (e.response && e.response.status) {
      console.error(JSON.stringify(e.response.data));
    } else {
      console.error("imagen-4.0-generate-001 Error:", e.message);
    }
  }
}
run();
