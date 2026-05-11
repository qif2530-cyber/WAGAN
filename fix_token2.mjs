import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = \`if (isKling && API_KEY) {
           // Provide safe net for official Kling AK/SK
           const parts = API_KEY.split(/[\\.:\\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }\`;
       
const replacement = \`if (isKling && API_KEY) {
           // Provide safe net for official Kling AK/SK
           const parts = API_KEY.split(/[\\.:\\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('klingai.com')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }\`;

content = content.replace(targetStr, replacement);
const targetStr2 = \`if (isKling && API_KEY) {
           const parts = API_KEY.split(/[\\.:\\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }\`;
const replacement2 = \`if (isKling && API_KEY) {
           const parts = API_KEY.split(/[\\.:\\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('klingai.com')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }\`;

content = content.replace(targetStr2, replacement2);
fs.writeFileSync('server.ts', content);
console.log('Fixed token');
