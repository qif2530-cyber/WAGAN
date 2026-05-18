import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  let operation = await ai.models.generateVideos({
    model: "veo-2.0-generate-001",
    prompt: "Cinematic shot of a bright red panda.",
    config: { numberOfVideos: 1, aspectRatio: "16:9" }
  });
  console.log("Started operation:", operation.name);
  while (!operation.done) {
     await new Promise(r => setTimeout(r, 10000));
     operation = await ai.operations.getVideosOperation({ operation });
     console.log("Wait...");
  }
  const video = operation.response?.generatedVideos?.[0]?.video;
  console.log("Video Object keys:", Object.keys(video || {}));
  console.log("Video Object:", JSON.stringify(video, null, 2));

  // Let's try ai.files.get() with the URI?
}
test().catch(console.error);
