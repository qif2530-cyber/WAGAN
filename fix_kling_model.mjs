import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetBlock1 = `       let klingActualModelName = "kling-v1-5";
       if (model.includes('v1-5') || model.includes('1.5') || model.includes('o1') || model.includes('omni') || model.includes('v3')) {
           klingActualModelName = "kling-v1-5";
       } else if (model.includes('v1') || model === 'kling') {
           klingActualModelName = "kling-v1";
       }`;
       
const replacementBlock = `       let klingActualModelName = model;
       if (model === 'kling') {
           klingActualModelName = "kling-v1-5";
       }`;
       
content = content.replace(targetBlock1, replacementBlock);
content = content.replace(targetBlock1, replacementBlock);

fs.writeFileSync('server.ts', content);
console.log('Fixed klingActualModelName');
