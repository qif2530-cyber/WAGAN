import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// I will just use string index!
let start = content.indexOf("if (klingVideoPath === 'image2video' && req.body.referenceImage) {");
let block = content.substring(start, start + 500);

let newBlock = block.replace("if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';", "");
newBlock = newBlock.replace("if (req.body.videoResolution === '720p') submitBody.mode = 'std';", "");

content = content.replace(block, newBlock);

let as_st = content.indexOf("if (req.body.aspectRatio) {");
let as_en = content.indexOf("}", as_st);
content = content.substring(0, as_en + 1) + "\\n           if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n           if (req.body.videoResolution === '720p') submitBody.mode = 'std';" + content.substring(as_en + 1);

fs.writeFileSync('server.ts', content);
