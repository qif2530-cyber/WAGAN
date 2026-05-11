import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `submitBody.model_name = model; submitBody.model = model; // For proxy compatibility`;
const replacementStr = `submitBody.model = model; // For proxy compatibility`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log('Cleaned up line 839');
