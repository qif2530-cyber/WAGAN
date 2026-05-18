import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/"\/v1\/images\/generations"/g, 'req.path');
fs.writeFileSync('server.ts', content);
console.log('Fixed hardcoded endpoint paths in server.ts');
