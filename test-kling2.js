import https from 'https';
const data = JSON.stringify({
    model_name: "kling-v3",
    prompt: "A beautiful sunset"
});
const options = {
    hostname: 'api-beijing.klingai.com',
    port: 443,
    path: '/v1/videos/text2video',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer test'
    }
};
const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', (d) => { process.stdout.write(d); });
});
req.on('error', (error) => { console.error(error); });
req.write(data);
req.end();
