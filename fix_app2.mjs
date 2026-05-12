import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `setAdminFluxBaseUrl(data.fluxBaseUrl || "");
        setAdminMjMode(data.mjMode || 'openai');`;

const replacement = `setAdminFluxBaseUrl(data.fluxBaseUrl || "");
        setAdminJimengKey(data.jimengKey || "");
        setAdminJimengBaseUrl(data.jimengBaseUrl || "");
        setAdminKlingKey(data.klingKey || "");
        setAdminKlingBaseUrl(data.klingBaseUrl || "");
        setAdminDeepseekKey(data.deepseekKey || "");
        setAdminDeepseekBaseUrl(data.deepseekBaseUrl || "");
        setAdminMjMode(data.mjMode || 'openai');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx fixed");
