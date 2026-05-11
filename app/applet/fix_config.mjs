import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `let runtimeMjMode: 'openai' | 'task' = (process.env.MJ_MODE as any) || 'openai';
let runtimeProxySecret = process.env.PROXY_SECRET_KEY || "liangshan";`;

const replacementStr = `let runtimeMjMode: 'openai' | 'task' = (process.env.MJ_MODE as any) || 'openai';
let runtimeProxySecret = process.env.PROXY_SECRET_KEY || "liangshan";

// Load overrides from config.json if it exists
try {
  if (fs.existsSync('wagan_config.json')) {
    const savedConfig = JSON.parse(fs.readFileSync('wagan_config.json', 'utf8'));
    if (savedConfig.runtimeGeminiKey) runtimeGeminiKey = savedConfig.runtimeGeminiKey;
    if (savedConfig.runtimeOpenaiKey) runtimeOpenaiKey = savedConfig.runtimeOpenaiKey;
    if (savedConfig.runtimeOpenaiBaseUrl !== undefined) runtimeOpenaiBaseUrl = savedConfig.runtimeOpenaiBaseUrl;
    if (savedConfig.runtimeMidjourneyKey) runtimeMidjourneyKey = savedConfig.runtimeMidjourneyKey;
    if (savedConfig.runtimeMidjourneyBaseUrl !== undefined) runtimeMidjourneyBaseUrl = savedConfig.runtimeMidjourneyBaseUrl;
    if (savedConfig.runtimeFluxKey) runtimeFluxKey = savedConfig.runtimeFluxKey;
    if (savedConfig.runtimeFluxBaseUrl !== undefined) runtimeFluxBaseUrl = savedConfig.runtimeFluxBaseUrl;
    if (savedConfig.runtimeJimengKey) runtimeJimengKey = savedConfig.runtimeJimengKey;
    if (savedConfig.runtimeJimengBaseUrl !== undefined) runtimeJimengBaseUrl = savedConfig.runtimeJimengBaseUrl;
    if (savedConfig.runtimeKlingKey) runtimeKlingKey = savedConfig.runtimeKlingKey;
    if (savedConfig.runtimeKlingBaseUrl !== undefined) runtimeKlingBaseUrl = savedConfig.runtimeKlingBaseUrl;
    if (savedConfig.runtimeDeepseekKey) runtimeDeepseekKey = savedConfig.runtimeDeepseekKey;
    if (savedConfig.runtimeDeepseekBaseUrl !== undefined) runtimeDeepseekBaseUrl = savedConfig.runtimeDeepseekBaseUrl;
    if (savedConfig.runtimeWhitelist) runtimeWhitelist = savedConfig.runtimeWhitelist;
    if (savedConfig.runtimeMjMode) runtimeMjMode = savedConfig.runtimeMjMode;
    console.log("Loaded configurations from wagan_config.json");
  }
} catch (e) {
  console.error("Failed to load wagan_config.json", e);
}

function saveConfigToFile() {
  try {
    fs.writeFileSync('wagan_config.json', JSON.stringify({
      runtimeGeminiKey,
      runtimeOpenaiKey,
      runtimeOpenaiBaseUrl,
      runtimeMidjourneyKey,
      runtimeMidjourneyBaseUrl,
      runtimeFluxKey,
      runtimeFluxBaseUrl,
      runtimeJimengKey,
      runtimeJimengBaseUrl,
      runtimeKlingKey,
      runtimeKlingBaseUrl,
      runtimeDeepseekKey,
      runtimeDeepseekBaseUrl,
      runtimeWhitelist,
      runtimeMjMode
    }, null, 2), 'utf8');
  } catch(e) {
    console.error("Failed to save wagan_config.json", e);
  }
}
`;

content = content.replace(targetStr, replacementStr);

const targetSaveStr = `  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),`;

const replacementSaveStr = `  saveConfigToFile();
  
  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),`;

content = content.replace(targetSaveStr, replacementSaveStr);
fs.writeFileSync('server.ts', content);
console.log('Done');
