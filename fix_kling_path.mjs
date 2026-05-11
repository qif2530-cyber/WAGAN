import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// replace klingVideoPath logic
content = content.replace(/let klingVideoPath = model\.includes\('o1'\) \|\| model\.includes\('omni'\) \? 'omni-video' : 'text2video';/g, "let klingVideoPath = 'text2video';");

fs.writeFileSync('server.ts', content);
console.log('Fixed klingVideoPath in server.ts');
