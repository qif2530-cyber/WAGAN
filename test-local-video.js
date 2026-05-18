const fetch = require("node-fetch") || global.fetch;

async function run() {
  console.log("Sending video generation request...");
  const body = {
      model: "veo-2.0-generate-001",
      prompt: "Cinematic shot of a bright red panda taking a sip of hot tea on a snowy mountain.",
      aspectRatio: "16:9"
  };
  
  const res = await fetch("http://127.0.0.1:3000/api/video", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer aiLZS253"
      },
      body: JSON.stringify(body)
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text.substring(0, 1000));
}

run();
