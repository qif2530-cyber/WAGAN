import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = "if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-'))";
const replacement1 = "if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('kling'))";
content = content.replace(target1, replacement1);
content = content.replace(target1, replacement1); // two places probably

fs.writeFileSync('server.ts', content);
console.log('Done');
