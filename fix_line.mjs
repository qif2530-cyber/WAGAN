import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `let klingVideoPath = 'text2video';
       if (isKling && req.body.referenceImage) {
           klingVideoPath = 'image2video';
       }`;

const replacementStr = `let klingVideoPath = model.includes('o1') || model.includes('omni') ? 'omni-video' : 'text2video';
       if (isKling && req.body.referenceImage && !model.includes('o1') && !model.includes('omni')) {
           klingVideoPath = 'image2video';
       }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log('Fixed line 792');
