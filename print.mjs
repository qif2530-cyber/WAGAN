import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const s1_index = content.indexOf("submitBody.image = req.body.referenceImage;");
console.log(JSON.stringify(content.substring(s1_index, s1_index + 300)));

const s2_index = content.indexOf("if (req.body.aspectRatio) {");
console.log(JSON.stringify(content.substring(s2_index, s2_index + 150)));

