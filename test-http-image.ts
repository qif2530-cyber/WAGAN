import fetch from 'node-fetch';

async function run() {
  try {
    const response = await fetch("http://localhost:3000/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer my_secure_password_123`
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image-preview",
        prompt: "赛博朋克风格的未来城市，一只红腹锦鸡站在屋顶上，最新数字单反拍摄，8k，写实。",
        n: 1,
        aspectRatio: "1:1",
        size: "1024x1024",
        response_format: "b64_json"
      })
    });
    const data = await response.json();
    console.log("Status:", response.status);
    if (!response.ok) {
        console.log("Error Response:", JSON.stringify(data));
    } else {
        console.log("Success! Data keys:", Object.keys(data));
    }
  } catch(e) {
    console.error(e);
  }
}
run();
