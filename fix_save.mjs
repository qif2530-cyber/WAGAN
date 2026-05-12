import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const getStr = `app.get("/api/admin/config", requireAuth, (req, res) => {
  saveConfigToFile();
  
  res.json({ `;
const newGetStr = `app.get("/api/admin/config", requireAuth, (req, res) => {
  res.json({ `;

content = content.replace(getStr, newGetStr);

const postStr = `    runtimeMjMode = mjMode;
  }
  
  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),`;

const newPostStr = `    runtimeMjMode = mjMode;
  }
  
  saveConfigToFile();
  
  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),`;

content = content.replace(postStr, newPostStr);
fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
