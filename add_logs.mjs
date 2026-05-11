import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `const submitResponse = await fetch(submitUrl, {`;
const replacementStr = `console.log("Sending request to:", submitUrl);
       const submitResponse = await fetch(submitUrl, {`;

content = content.replace(targetStr, replacementStr);
content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log('Added logs');
