import { GoogleGenAI } from "@google/genai";

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: [{ role: 'user', parts: [{ text: "赛博朋克风格的未来城市，一只红腹锦鸡站在屋顶上，最新数字单反拍摄，8k，写实。" }] }],
            config: {
                // testing with numberOfImages, personGeneration
                imageConfig: {
                    aspectRatio: "1:1", 
                    numberOfImages: 1,
                    // personGeneration: "ALLOW_ALL"
                    // imageSize: "1K"
                } as any
            }
        });
        console.log("Success with numberOfImages");
    } catch(err: any) {
        console.log("Error details:");
        console.log("Status:", err.status);
        console.log("Message:", err.message);
        console.log("Name:", err.name);
    }
}
run();
