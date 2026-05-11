import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// replace token generation logic to only apply to official klingai.com
content = content.replace(
    /if \\(isKling && API_KEY\\) \\{[\\s\\S]+?tokenToUse = generateKlingJwt\\(parts\\[0\\], parts\\[1\\]\\);\\s*\\}\\s*\\}/g,
    \`if (isKling && API_KEY) {
           const parts = API_KEY.split(/[\\.:\\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('klingai.com')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }\`
);

fs.writeFileSync('server.ts', content);
console.log('Fixed token generation in server.ts');
