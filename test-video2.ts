import { GoogleGenAI } from '@google/genai';
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return console.log('no key');
  const ai = new GoogleGenAI({ apiKey });
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: 'Cinematic shot of a bright red panda taking a sip of hot tea on a snowy mountain.',
    config: { numberOfVideos: 1, aspectRatio: '16:9' }
  });
  console.log('Started operation:', operation.name);
  while (!operation.done) {
     await new Promise(r => setTimeout(r, 10000));
     operation = await ai.operations.getVideosOperation({ operation });
     console.log('Wait...');
  }
  console.log('Done!', JSON.stringify(operation.response?.generatedVideos?.[0]?.video, null, 2));
}
test().catch(console.error);