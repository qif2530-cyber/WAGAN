import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `recordDispatchLog(false, "/api/v1/generate", req.body?.model, error.message || "内部服务错误", error, req);`;
const replacementStr = `recordDispatchLog(false, "/api/v1/generate", req.body?.model, "fetch failed: " + (typeof submitUrl !== 'undefined' ? submitUrl : "unknown URL") + " - " + error.message, Object.keys(error).length === 0 ? error.message : error, req);`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log('Added more logs');
