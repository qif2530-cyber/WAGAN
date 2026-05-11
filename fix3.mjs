import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// replace mode declarations completely:
content = content.replace(/\\s+if \\(req\\.body\\.videoResolution === '1080p'\\) submitBody\\.mode = 'pro';/g, "");
content = content.replace(/\\s+if \\(req\\.body\\.videoResolution === '720p'\\) submitBody\\.mode = 'std';/g, "");

content = content.replace('submitBody.aspect_ratio = req.body.aspectRatio;\\n            }', "submitBody.aspect_ratio = req.body.aspectRatio;\\n            }\\n            if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n            if (req.body.videoResolution === '720p') submitBody.mode = 'std';");
content = content.replace('submitBody.aspect_ratio = req.body.aspectRatio;\\r\\n            }', "submitBody.aspect_ratio = req.body.aspectRatio;\\r\\n            }\\r\\n            if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\r\\n            if (req.body.videoResolution === '720p') submitBody.mode = 'std';");

fs.writeFileSync('server.ts', content);
