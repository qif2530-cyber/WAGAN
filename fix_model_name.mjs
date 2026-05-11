import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("submitBody.model = model; // For proxy compatibility", "submitBody.model_name = model; submitBody.model = model; // For proxy compatibility");

content = content.replace("let klingVideoPath = 'text2video';\n        if (isKling && req.body.referenceImage) {\n            klingVideoPath = 'image2video';\n        }", "let klingVideoPath = model.includes('o1') || model.includes('omni') ? 'omni-video' : 'text2video';\n        if (isKling && req.body.referenceImage && !model.includes('o1') && !model.includes('omni')) {\n            klingVideoPath = 'image2video';\n        }");

content = content.replace("let klingVideoPath = 'text2video';\n       let submitUrl = isKling ? `${BASE_URL.replace(/\\/$/, '')}/videos/${klingVideoPath}` : `${BASE_URL.replace(/\\/$/, '')}/contents/generations/tasks`;\n", "let klingVideoPath = model.includes('o1') || model.includes('omni') ? 'omni-video' : 'text2video';\n       let submitUrl = isKling ? `${BASE_URL.replace(/\\/$/, '')}/videos/${klingVideoPath}` : `${BASE_URL.replace(/\\/$/, '')}/contents/generations/tasks`;\n");


fs.writeFileSync('server.ts', content);
console.log('Fixed model name');
