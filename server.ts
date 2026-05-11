import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import compression from 'compression';
import crypto from 'crypto';

function generateKlingJwt(ak: string, sk: string) {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        iss: ak,
        exp: Math.floor(Date.now() / 1000) + 1800, // Valid for 30 mins
        nbf: Math.floor(Date.now() / 1000) - 5
    };
    
    const base64UrlEncode = (obj: any) => {
        return Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };
    
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', sk)
        .update(signatureInput)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
        
    return `${signatureInput}.${signature}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 工具函数：解析 Data URI 并提取 mimeType 和纯 base64 数据
function parseDataUri(dataUri: string) {
  if (dataUri.startsWith('data:')) {
    const commaIndex = dataUri.indexOf(',');
    if (commaIndex !== -1) {
      const header = dataUri.substring(5, commaIndex);
      const mimeType = header.split(';')[0] || 'image/jpeg';
      const data = dataUri.substring(commaIndex + 1).replace(/\s+/g, '');
      return { mimeType, data };
    }
  }
  return { mimeType: "image/jpeg", data: dataUri.replace(/\s+/g, '') };
}

// Lazy initialization of Gemini API
// If user provides a custom key in the request, use it. Otherwise use the runtime key.
let runtimeGeminiKey = process.env.GEMINI_API_KEY || "AIzaSyBR2Rx861b6lmzQ49y1n7CavNt4Ai9JZC8";
let runtimeOpenaiKey = process.env.OPENAI_API_KEY || "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";
let runtimeOpenaiBaseUrl = process.env.OPENAI_BASE_URL || "";

// Add Midjourney and Flux specific keys/urls
let runtimeMidjourneyKey = process.env.MIDJOURNEY_API_KEY || "";
let runtimeMidjourneyBaseUrl = process.env.MIDJOURNEY_BASE_URL || "";
let runtimeFluxKey = process.env.FLUX_API_KEY || "";
let runtimeFluxBaseUrl = process.env.FLUX_BASE_URL || "";
let runtimeJimengKey = process.env.JIMENG_API_KEY || "";
let runtimeJimengBaseUrl = process.env.JIMENG_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
let runtimeKlingKey = process.env.KLING_API_KEY || "";
let runtimeKlingBaseUrl = process.env.KLING_BASE_URL || "https://api.klingai.com/v1";
let runtimeDeepseekKey = process.env.DEEPSEEK_API_KEY || "";
let runtimeDeepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
let runtimeMjMode: 'openai' | 'task' = (process.env.MJ_MODE as any) || 'openai';
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


function getAI(): GoogleGenAI {
  const keyToUse = runtimeGeminiKey;
  if (!keyToUse) {
    throw new Error("GEMINI_API_KEY is not set. 鉴权失败：网关控制面板尚未配置底层 GEMINI_API_KEY。");
  }
  return new GoogleGenAI({ apiKey: keyToUse });
}

// 辅助函数：统一处理模型名称映射，将虚拟模型映射到真实存在的 Google 模型
function mapModelName(model: string): string {
  if (!model) return "gemini-2.5-pro";
  if (model.includes("imagen-3.0-fast")) return "imagen-4.0-fast-generate-001";
  if (model.includes("imagen-3.0")) return "imagen-4.0-generate-001";
  if (model === "jimeng-5.0" || model === "doubao-seedream-5.0-lite") return "ep-20260511162417-9xd8q";
  if (model === "jimeng-4.5" || model === "doubao-seedream-4.5") return "ep-20260511162504-fjd6v";
  if (model === "doubao-seedance-2.0") return "ep-20260511162215-hrcmj";
  if (model === "doubao-seedance-2.0-fast") return "ep-20260511162340-5xlpt";
  return model;
}

// 辅助函数：判断是否为即梦/豆包模型
function isVolcengineImageModel(originalModel: string, actionType?: string): boolean {
  if (actionType === 'jimeng-video') return false;
  if (actionType === 'jimeng-image') return true;
  return (originalModel.includes('jimeng') || originalModel.includes('doubao') || originalModel.includes('seedream')) && !originalModel.includes('video') && !originalModel.includes('seedance');
}

function isVolcengineVideoModel(originalModel: string, actionType?: string): boolean {
  if (actionType === 'jimeng-video') return true;
  return (originalModel.includes('jimeng') && originalModel.includes('video')) || originalModel.includes('seedance');
}

const app = express();
const PORT = 3000;

// Trust reverse proxy (like Cloud Run or Nginx) to get the real client IP in req.ip
app.set("trust proxy", true);

function getRealClientIP(req: express.Request): string {
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  const realIp = req.headers['x-real-ip'] as string;
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
  const cloudRunDirect = req.ip;
  let clientIp = cfConnectingIp || realIp;
  if (!clientIp && forwardedFor) clientIp = forwardedFor.split(',')[0].trim();
  if (!clientIp) clientIp = cloudRunDirect || 'Unknown';
  const country = req.headers['cf-ipcountry'] || req.headers['x-client-geo-location'] || 'Unknown Region';
  return `${clientIp} (${country})`;
}

let runtimeWhitelist = (process.env.IP_WHITELIST || "127.0.0.1,::1").split(',').map(ip => ip.trim());

function isWhitelisted(req: express.Request): boolean {
  const ip = getRealClientIP(req).split(' ')[0]; // 只比对 IP 本体
  return runtimeWhitelist.includes(ip) || ip.includes('localhost') || ip === '::1' || ip === '127.0.0.1';
}

// Middleware
app.use(compression()); // 启用 GZIP 压缩大幅减少底图响应数据体积！
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images
app.use(cors());

// ==========================================
// 防御攻击与限流层 (Anti-DDoS & Rate Limiting)
// ==========================================

// 1. 全局基础频控：防暴力破解和 CC 攻击 (每 IP 每分钟 60 次请求)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 60,
  keyGenerator: (req) => getRealClientIP(req).split(' ')[0],
  message: {
    error: "触发安全频控 (Too Many Requests)",
    detail: "网关探测到您的源 IP 请求频率异常。请降低并发请求速度，1分钟后自动解封。"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. 高算力重度生图/视频频控 (每 IP 每分钟限制 15 次请求)
const heavyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 15,
  skip: (req) => isWhitelisted(req), // 白名单 IP 强制跳过 15 次频控，受并发池控制
  keyGenerator: (req) => getRealClientIP(req).split(' ')[0],
  message: {
    error: "超额消耗：触发算力频段封锁 (Heavy Capacity Limit Reached)",
    detail: "生成图像或视频过于频繁。请控制排队分发策略，限制单用户每分钟的生成次数以免消耗过度。"
  }
});

// 应用全局基础限流到所有以 /api/ 开头的路由
app.use('/api/', globalLimiter);

// 健康检查接口 (无需鉴权)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), node_env: process.env.NODE_ENV });
});

// 3. 多媒体并发控制中间件 (Media Concurrency Limiter)
const activeMediaRequests = new Map<string, number>();

function mediaConcurrencyLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = getRealClientIP(req).split(' ')[0];
  const isVip = isWhitelisted(req);
  
  // 普通 IP 同一时刻只能进行 1 张图片/视频的异步请求排队。白名单允许高达 8 路并发。
  const maxConcurrent = isVip ? 8 : 1;
  const currentActive = activeMediaRequests.get(clientIp) || 0;

  if (currentActive >= maxConcurrent) {
     return res.status(429).json({
        error: "并发请求数达到上限 (Concurrent Request Limit Reached)",
        detail: isVip 
          ? `VIP 账户保护机制：您的最高并发为 ${maxConcurrent} 路流媒体生成任务。目前正在执行中，请等候其中之一完结。` 
          : `为保护底层配额，普通用户同一时间只能生成 1 张图片或视频。如需开展业务进行并发分发，请将阿里云源 IP 填入 IP_WHITELIST。`
     });
  }

  activeMediaRequests.set(clientIp, currentActive + 1);

  let released = false;
  const release = () => {
     if (released) return;
     released = true;
     const active = activeMediaRequests.get(clientIp) || 0;
     if (active > 0) {
       activeMediaRequests.set(clientIp, active - 1);
       if (active - 1 === 0) activeMediaRequests.delete(clientIp); // 清理内存
     }
  };

  res.on('finish', release);
  res.on('close', release);
  res.on('error', release);

  next();
}

// ==========================================
// 计费与消费记录系统 (Billing & Logging System)
// ==========================================
const billingLogs: any[] = []; // 内存版账单记录日志（演示用途，重启后重置）
const dispatchLogs: any[] = []; // 全局调度系统日志

function recordDispatchLog(success: boolean, endpoint: string, model: string, message: string, detail: any, req: express.Request, result?: any) {
  const ipInfo = getRealClientIP(req);

  // 截断巨大的 base64 数据防止内存泄漏和事件循环阻塞
  const cleanPayload = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      return obj.length > 2000 ? obj.substring(0, 100) + '...[TRUNCATED_LONG_STRING]' : obj;
    }
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) return obj.map(cleanPayload);
      const cleaned: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'b64_json' || k === 'referenceImage' || k === 'image' || k === 'init_image') {
          cleaned[k] = typeof v === 'string' ? v.substring(0, 50) + '...[BASE64_IMAGE_TRUNCATED]' : v;
        } else if (k === 'url' && typeof v === 'string' && v.startsWith('data:image')) {
          cleaned[k] = v.substring(0, 50) + '...[BASE64_URL_TRUNCATED]';
        } else {
          cleaned[k] = cleanPayload(v);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const safeDetail = cleanPayload(detail);
  const safeResult = cleanPayload(result);

  const log = {
    id: Date.now().toString() + Math.floor(Math.random()*1000),
    timestamp: new Date().toISOString(),
    ip: ipInfo,
    endpoint,
    model: model || 'unknown',
    success,
    message,
    detail: typeof safeDetail === 'object' ? JSON.stringify(safeDetail, null, 2) : String(safeDetail),
    result: safeResult ? (typeof safeResult === 'object' ? JSON.stringify(safeResult, null, 2) : String(safeResult)) : null
  };
  
  dispatchLogs.unshift(log);
  if (dispatchLogs.length > 1000) dispatchLogs.pop();
  console.log(`[调度记录] IP: ${log.ip} | 接口: ${endpoint} | 模型: ${log.model} | 结果: ${success ? '成功' : '失败'} | 信息: ${message}`);
}

function calculateEstimatedCost(apiType: string, model: string, usage: any): number {
  let cost = 0;
  try {
    if (apiType === 'chat') {
      const inTokens = usage?.inputTokens || 0;
      const outTokens = usage?.outputTokens || 0;
      if (model.includes('gemini-3.1-pro')) {
        // Gemini Pro: $1.25 / 1M input, $5.00 / 1M output
        cost = (inTokens / 1000000) * 1.25 + (outTokens / 1000000) * 5.00;
      } else if (model.includes('gpt-4o-mini')) {
        // GPT-4o-mini: $0.150 / 1M input, $0.600 / 1M output
        cost = (inTokens / 1000000) * 0.15 + (outTokens / 1000000) * 0.60;
      } else if (model.includes('gpt-4o')) {
         // GPT-4o: $2.50 / 1M input, $10.00 / 1M output (Updated pricing)
         cost = (inTokens / 1000000) * 2.50 + (outTokens / 1000000) * 10.00;
      }
    } else if (apiType === 'image') {
      cost = (usage?.imageCount || 1) * 0.03; 
    } else if (apiType === 'video') {
       cost = 0.80;
    }
  } catch (e) {
    console.error("Calculate Cost Error:", e);
  }
  return Number(cost.toFixed(6));
}

function recordBillingLog(apiType: string, model: string, prompt: string, usage: any, req: express.Request) {
  const cost = calculateEstimatedCost(apiType, model, usage);
  const ipInfo = getRealClientIP(req);
  
  const log = {
    id: Date.now().toString() + Math.floor(Math.random()*1000),
    timestamp: new Date().toISOString(),
    ip: ipInfo,
    apiType,
    model,
    prompt: prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt,
    usage,
    estimatedCostUsd: cost
  };
  
  billingLogs.unshift(log); // 压入头部
  if (billingLogs.length > 1000) billingLogs.pop(); // 保留最近1000条
  
  console.log(`[账单] IP: ${log.ip} | 模型: ${model} | 花费: $${cost}`);
  return cost;
}


// ==========================================
// 1. 国内内容审核逻辑 (Domestic Content Moderation)
// ==========================================
const FORBIDDEN_WORDS = [
  "敏感词汇1",
  "敏感词汇2",
  "违规内容",
  // 在这里添加更多你想拦截的词汇
  // Add more keywords as needed, or integrate with Aliyun Green API
];

function isContentSafe(text: string): boolean {
  if (!text) return true;
  const content = text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (content.includes(word.toLowerCase())) {
      return false; // Found forbidden word
    }
  }
  return true;
}

// ==========================================
// 2. 鉴权逻辑 (Authentication)
// ==========================================
// Your Aliyun server MUST send this token in the header.
// Header name: "Authorization", Value: "Bearer YOUR_SECRET_PASSWORD"
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[Auth Failed] Missing or invalid Authorization header from ${getRealClientIP(req)}`);
    return res.status(401).json({ success: false, error: "未授权：请提供有效的 Authorization Bearer token。" });
  }
  const token = authHeader.split(' ')[1];
  if (token !== runtimeProxySecret) {
    console.log(`[Auth Failed] Token mismatch from ${getRealClientIP(req)}. Provided: ${token ? '***' + token.slice(-3) : 'none'}`);
    return res.status(403).json({ success: false, error: "鉴权未通过：私有锁口令 (PROXY_SECRET_KEY) 不正确。" });
  }
  next();
}

// 中间件：全局拦截非法文本输入
app.use("/api", (req, res, next) => {
  // Check prompt parameter for safety
  const prompt = req.body.prompt;
  if (prompt && !isContentSafe(prompt)) {
    return res.status(403).json({ error: "请求被拒绝：包含不合规的内容词汇。(Content Rejected by Moderation)" });
  }
  next();
});

// ==========================================
// 3. API 接口路由 (API Endpoints)
// ==========================================

// 健康检查 (Health Check)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "海外 API 代理服务运行正常 (API Proxy is running)" });
});

// 内部调取账单记录的接口
app.get("/api/billing", (req, res) => {
  res.json({ success: true, logs: billingLogs.slice(0, 50) }); // 只返回最近 50 条，优化速度
});

// 内部调取错误日志的接口
app.get("/api/dispatch-logs", (req, res) => {
  res.json({ success: true, logs: dispatchLogs.slice(0, 50) }); // 只返回最近 50 条，提升前端排查渲染速度
});

// 新增：动态配置管理接口 (包含白名单及各厂商密钥)
app.get("/api/admin/config", requireAuth, (req, res) => {
  saveConfigToFile();
  
  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),
    geminiKey: runtimeGeminiKey ? `${runtimeGeminiKey.substring(0, 4)}****${runtimeGeminiKey.substring(runtimeGeminiKey.length - 4)}` : "",
    openaiKey: runtimeOpenaiKey ? `${runtimeOpenaiKey.substring(0, 4)}****${runtimeOpenaiKey.substring(runtimeOpenaiKey.length - 4)}` : "",
    openaiBaseUrl: runtimeOpenaiBaseUrl,
    midjourneyKey: runtimeMidjourneyKey ? `${runtimeMidjourneyKey.substring(0, 4)}****${runtimeMidjourneyKey.substring(runtimeMidjourneyKey.length - 4)}` : "",
    midjourneyBaseUrl: runtimeMidjourneyBaseUrl,
    fluxKey: runtimeFluxKey ? `${runtimeFluxKey.substring(0, 4)}****${runtimeFluxKey.substring(runtimeFluxKey.length - 4)}` : "",
    fluxBaseUrl: runtimeFluxBaseUrl,
    jimengKey: runtimeJimengKey ? `${runtimeJimengKey.substring(0, 4)}****${runtimeJimengKey.substring(runtimeJimengKey.length - 4)}` : "",
    jimengBaseUrl: runtimeJimengBaseUrl,
    klingKey: runtimeKlingKey ? `${runtimeKlingKey.substring(0, 4)}****${runtimeKlingKey.substring(runtimeKlingKey.length - 4)}` : "",
    klingBaseUrl: runtimeKlingBaseUrl,
    deepseekKey: runtimeDeepseekKey ? `${runtimeDeepseekKey.substring(0, 4)}****${runtimeDeepseekKey.substring(runtimeDeepseekKey.length - 4)}` : "",
    deepseekBaseUrl: runtimeDeepseekBaseUrl,
    mjMode: runtimeMjMode
  });
});

app.post("/api/admin/config", requireAuth, (req, res) => {
  console.log(`[Admin] Received config update request from ${getRealClientIP(req)}`);
  const { whitelist, geminiKey, openaiKey, openaiBaseUrl, midjourneyKey, midjourneyBaseUrl, fluxKey, fluxBaseUrl, jimengKey, jimengBaseUrl, klingKey, klingBaseUrl, deepseekKey, deepseekBaseUrl, mjMode } = req.body;
  if (whitelist !== undefined) {
    runtimeWhitelist = whitelist.split(',').map((ip: string) => ip.trim()).filter((ip: string) => ip.length > 0);
  }
  if (geminiKey && !geminiKey.includes("****")) {
    runtimeGeminiKey = geminiKey;
  }
  if (openaiKey && !openaiKey.includes("****")) {
    runtimeOpenaiKey = openaiKey;
  }
  if (openaiBaseUrl !== undefined) { // Base URL can be empty to fallback to default
    runtimeOpenaiBaseUrl = openaiBaseUrl.trim();
  }
  if (midjourneyKey && !midjourneyKey.includes("****")) {
    runtimeMidjourneyKey = midjourneyKey;
  }
  if (midjourneyBaseUrl !== undefined) {
    runtimeMidjourneyBaseUrl = midjourneyBaseUrl.trim();
  }
  if (fluxKey && !fluxKey.includes("****")) {
    runtimeFluxKey = fluxKey;
  }
  if (fluxBaseUrl !== undefined) {
    runtimeFluxBaseUrl = fluxBaseUrl.trim();
  }
  if (jimengKey && !jimengKey.includes("****")) {
    runtimeJimengKey = jimengKey;
  }
  if (jimengBaseUrl !== undefined) {
    runtimeJimengBaseUrl = jimengBaseUrl.trim();
  }
  if (klingKey && !klingKey.includes("****")) {
    runtimeKlingKey = klingKey;
  }
  if (klingBaseUrl !== undefined) {
    runtimeKlingBaseUrl = klingBaseUrl.trim();
  }
  if (deepseekKey && !deepseekKey.includes("****")) {
    runtimeDeepseekKey = deepseekKey;
  }
  if (deepseekBaseUrl !== undefined) {
    runtimeDeepseekBaseUrl = deepseekBaseUrl.trim();
  }
  if (mjMode !== undefined) {
    runtimeMjMode = mjMode;
  }
  
  res.json({ 
    success: true, 
    whitelist: runtimeWhitelist.join(', '),
    geminiKey: runtimeGeminiKey ? `${runtimeGeminiKey.substring(0, 4)}****${runtimeGeminiKey.substring(runtimeGeminiKey.length - 4)}` : "",
    openaiKey: runtimeOpenaiKey ? `${runtimeOpenaiKey.substring(0, 4)}****${runtimeOpenaiKey.substring(runtimeOpenaiKey.length - 4)}` : "",
    openaiBaseUrl: runtimeOpenaiBaseUrl,
    midjourneyKey: runtimeMidjourneyKey ? `${runtimeMidjourneyKey.substring(0, 4)}****${runtimeMidjourneyKey.substring(runtimeMidjourneyKey.length - 4)}` : "",
    midjourneyBaseUrl: runtimeMidjourneyBaseUrl,
    fluxKey: runtimeFluxKey ? `${runtimeFluxKey.substring(0, 4)}****${runtimeFluxKey.substring(runtimeFluxKey.length - 4)}` : "",
    fluxBaseUrl: runtimeFluxBaseUrl,
    jimengKey: runtimeJimengKey ? `${runtimeJimengKey.substring(0, 4)}****${runtimeJimengKey.substring(runtimeJimengKey.length - 4)}` : "",
    jimengBaseUrl: runtimeJimengBaseUrl,
    klingKey: runtimeKlingKey ? `${runtimeKlingKey.substring(0, 4)}****${runtimeKlingKey.substring(runtimeKlingKey.length - 4)}` : "",
    klingBaseUrl: runtimeKlingBaseUrl,
    deepseekKey: runtimeDeepseekKey ? `${runtimeDeepseekKey.substring(0, 4)}****${runtimeDeepseekKey.substring(runtimeDeepseekKey.length - 4)}` : "",
    deepseekBaseUrl: runtimeDeepseekBaseUrl,
    mjMode: runtimeMjMode
  });
});

// 新增：自动调度多模型的统一网关 API (Omni-Router)
// 就像外部业务平台期待的那样：只用调用这一个接口，传了模型名字，网关自动分发
app.post("/api/v1/generate", heavyLimiter, mediaConcurrencyLimiter, requireAuth, async (req, res) => {
  try {
    let { model, prompt } = req.body;
    
    // 映射模型名称
    model = mapModelName(model);

    if (!prompt || !model) return res.status(400).json({ error: "缺少 prompt 或 model 参数 (Missing prompt or model)" });

    // 标准化尺寸识别 (Standardize size recognition)
    const rawSize = (req.body.size || req.body.imageSize || req.body.image_size || '1024x1024').toString().toLowerCase();
    let targetSize = '1024x1024';
    let geminiImageSize = '1K';

    if (rawSize.match(/^\d+x\d+$/)) { 
        targetSize = rawSize;
        if (rawSize.includes('2048') || rawSize.includes('1536')) geminiImageSize = '2K';
        else if (rawSize.includes('4096') || rawSize.includes('2304')) geminiImageSize = '4K';
        else if (rawSize.includes('512') || rawSize.includes('256')) geminiImageSize = '512';
        else geminiImageSize = '1K';
    } else {
        if (rawSize.includes('512') || rawSize === 'small') { targetSize = '512x512'; geminiImageSize = '512'; }
        else if (rawSize.includes('2048') || rawSize === '2k') { targetSize = '2048x2048'; geminiImageSize = '2K'; }
        else if (rawSize.includes('4096') || rawSize === '4k') { targetSize = '4096x2304'; geminiImageSize = '4K'; } // 16:9 for 4K
        else { targetSize = '1024x1024'; geminiImageSize = '1K'; }
    }

    // DALL-E 尺寸限制 (OpenAI 官方不支持 4K 请求参数名，最高只到 1792)
    if (model && (model.includes('dall-e') || model.includes('gpt-image'))) {
        if (targetSize.includes('4096') || targetSize.includes('2048')) {
            targetSize = targetSize.includes('2304') ? '1792x1024' : '1024x1024';
        }
    }

    console.log(`[Unified Gateway] Auto-routing request for model: ${model}, targetGeminiSize: ${geminiImageSize}`);

    // Sora 视频路线
    if (model.includes('sora')) {
       let API_KEY = runtimeOpenaiKey;
       let BASE_URL = runtimeOpenaiBaseUrl;
       if (!API_KEY) throw new Error(`网关未配置 ${model} 所需的 API Key`);
       
       // 由于 OpenAI 官方尚未将视频生成正式集成在 openai nodejs sdk 核心中，这里采用直接 fetch。
       const targetUrl = `${BASE_URL || "https://api.openai.com/v1"}/videos/generations`;
       const response = await fetch(targetUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${API_KEY}`
           },
           body: JSON.stringify({
               model: model,
               prompt: prompt
           })
       });

       const data = await response.json();
       if (!response.ok) {
           throw new Error(data.error?.message || data.error || JSON.stringify(data));
       }

       const videoUrl = data.data && data.data[0] ? data.data[0].url : (data.url || null);
       const estimatedCostUsd = recordBillingLog('video', model, prompt, { resolution: '720p' }, req);
       
       return res.json({ success: true, videoUrl: videoUrl || "", estimatedCostUsd, raw: data });
    }

    // OpenAI 图像与其他第三方代理图像路线 (MJ, Flux, DALL-E, gpt2, gpt-image)
    if (model.includes('dall-e') || model.includes('gpt2') || model.includes('gpt-image') || model.includes('midjourney') || model.includes('mj') || model.includes('flux')) {
       // Determine which key and base url to use based on model
       let isMidjourney = model.includes('midjourney') || model.includes('mj');
       let isFlux = model.includes('flux');

       let API_KEY = runtimeOpenaiKey;
       let BASE_URL = runtimeOpenaiBaseUrl;

       if (isMidjourney && runtimeMidjourneyKey) {
           API_KEY = runtimeMidjourneyKey;
       }
       if (isMidjourney && runtimeMidjourneyBaseUrl) {
           BASE_URL = runtimeMidjourneyBaseUrl;
       }

       if (isFlux && runtimeFluxKey) {
           API_KEY = runtimeFluxKey;
       }
       if (isFlux && runtimeFluxBaseUrl) {
           BASE_URL = runtimeFluxBaseUrl;
       }

       if (!API_KEY) throw new Error(`网关未配置 ${model} 所需的 API Key`);

       // 如果是 Midjourney 且处于任务模式 (Proxy 模式)
       if (isMidjourney && runtimeMjMode === 'task') {
          console.log("[Unified Gateway] MJ Proxy Task Mode Active. Submitting imagine task...");
          const submitResponse = await fetch(`${BASE_URL}/mj/submit/imagine`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'mj-api-secret': API_KEY
              },
              body: JSON.stringify({
                  prompt: prompt + (req.body.aspectRatio ? ` --ar ${req.body.aspectRatio}` : ''),
                  base64Array: req.body.referenceImage ? [req.body.referenceImage] : [],
                  referenceImage: req.body.referenceImage 
              })
          });

          const submitData: any = await submitResponse.json();
          if (!submitResponse.ok || submitData.code !== 1) {
              throw new Error(`MJ Proxy 提交失败: ${submitData.description || '未知错误'}`);
          }

          const taskId = submitData.result;
          console.log(`[Unified Gateway] Task submitted successfully: ${taskId}. Waiting for completion...`);

          // 开启轮询 (Polling)
          let finalUrl = "";
          let startTime = Date.now();
          const TIMEOUT = 120000; // 2分钟超时

          while (Date.now() - startTime < TIMEOUT) {
              await new Promise(r => setTimeout(r, 5000)); // 5秒轮询一次
              const fetchResponse = await fetch(`${BASE_URL}/mj/task/${taskId}/fetch`, {
                  headers: { 'mj-api-secret': API_KEY }
              });
              const fetchData: any = await fetchResponse.json();
              
              if (fetchData.status === 'SUCCESS' && fetchData.imageUrl) {
                  finalUrl = fetchData.imageUrl;
                  break;
              } else if (fetchData.status === 'FAILURE') {
                  throw new Error(`MJ Proxy 生成失败: ${fetchData.failReason || '任务执行错误'}`);
              }
              console.log(`[Unified Gateway] Task ${taskId} status: ${fetchData.status}...`);
          }

          if (!finalUrl) throw new Error("MJ Proxy 任务超时或未返回图片链接 (Task Timeout)");

          const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: 1, resolution: '1024x1024' }, req);
          return res.json({ success: true, imageUrl: finalUrl, estimatedCostUsd });
       }
       
       const openai = new OpenAI({ 
           apiKey: API_KEY,
           baseURL: BASE_URL || "https://api.openai.com/v1" 
       });
       
       let finalPrompt = prompt;
       if ((model.includes('midjourney') || model.includes('mj')) && req.body.aspectRatio) {
           if (!finalPrompt.includes('--ar')) {
               finalPrompt = `${finalPrompt} --ar ${req.body.aspectRatio}`;
           }
       }
       
       // 使用顶部已经算好的 targetSize
       const generateParams: any = {
         model: model,
         prompt: finalPrompt,
         n: req.body.numberOfImages || 1,
         size: targetSize as any, 
       };

       // 部分中转 API 不支持 response_format，如果是 gpt-image-2 就不传这个参数，默认返回 url
       if (!model.includes('gpt-image')) {
         generateParams.response_format = 'b64_json';
       }

       const response = await openai.images.generate(generateParams);
       
       let finalImageUrl = null;
       if (response.data[0].b64_json) {
           finalImageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
       } else if (response.data[0].url) {
           finalImageUrl = response.data[0].url;
       }

       const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: 1, resolution: '1024x1024' }, req);
       
       return res.json({ success: true, imageUrl: finalImageUrl, estimatedCostUsd });
    }

    // GPT / DeepSeek 路线
    if (model.includes('gpt') || model.includes('deepseek')) {
       let API_KEY = runtimeOpenaiKey;
       let BASE_URL = runtimeOpenaiBaseUrl || "https://api.openai.com/v1";
       
       if (model.includes('deepseek')) {
           API_KEY = runtimeDeepseekKey;
           BASE_URL = runtimeDeepseekBaseUrl || "https://api.deepseek.com";
       }

       if (!API_KEY) throw new Error(`网关未配置 ${model} 的 API_KEY`);
       
       const openai = new OpenAI({ 
           apiKey: API_KEY,
           baseURL: BASE_URL 
       });
       const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: prompt }]
       });
       
       const inTokens = response.usage?.prompt_tokens || 0;
       const outTokens = response.usage?.completion_tokens || 0;
       const estimatedCostUsd = recordBillingLog('chat', model, prompt, { inputTokens: inTokens, outputTokens: outTokens }, req);
       
       const msgResponse = response.choices[0]?.message as any;
       let textOut = msgResponse?.content || "";
       if (msgResponse?.reasoning_content) {
          textOut = `> **思考过程 (Reasoning):**\n> \n> ${msgResponse.reasoning_content.replace(/\n/g, '\n> ')}\n\n---\n\n${textOut}`;
       }

       return res.json({ success: true, text: textOut, estimatedCostUsd, raw: response });
    }

    // 即梦 Jimeng (图像) / 豆包 Seedream
    if (isVolcengineImageModel(req.body.model, req.body.actionType) || (model.startsWith('ep-') && !req.body.model.includes('video') && !req.body.model.includes('seedance') && !req.body.model.includes('dance') && req.body.actionType !== 'jimeng-video')) {
       const API_KEY = runtimeJimengKey;
       let BASE_URL = runtimeJimengBaseUrl || "https://ark.cn-beijing.volces.com/api/v3";
       BASE_URL = BASE_URL.trim().replace(/\/$/, '');
       if (BASE_URL.includes('ark.cn-beijing.volces.com') && !BASE_URL.includes('/api/v3')) {
           BASE_URL = `${BASE_URL}/api/v3`;
       }
       if (!API_KEY) throw new Error(`网关未配置火山引擎 (即梦/豆包) 所需的 API Key`);

       let jimengMappedSize = targetSize;
       
       const originalModel = req.body.model || '';
       if (originalModel.includes('5-0') || originalModel.includes('5.0') || originalModel.includes('4-5') || originalModel.includes('4.5') || model === "ep-20260511162417-9xd8q" || model === "ep-20260511162504-fjd6v") {
           const parts = targetSize.split('x');
           if (parts.length === 2) {
               let w = parseInt(parts[0]);
               let h = parseInt(parts[1]);
               const aspect = w / h;
               if (w * h < 3686400) {
                   h = Math.ceil(Math.sqrt(4194304 / aspect));
                   w = Math.ceil(h * aspect);
                   w = Math.ceil(w / 32) * 32;
                   h = Math.ceil(h / 32) * 32;
                   jimengMappedSize = `${w}x${h}`;
               }
           }
       }

       let reqBody: any = {
           model: model,
           prompt: prompt,
           size: jimengMappedSize,
           logo_info: { add_logo: false, is_logo_cleared: true },
           watermark: false
       };
       if (req.body.referenceImage) {
           reqBody.image = req.body.referenceImage;
       }

       let fetchUrl = BASE_URL.trim().replace(/\/$/, '');
       if (!fetchUrl.endsWith('/images/generations')) {
           fetchUrl = `${fetchUrl}/images/generations`;
       }

       const response = await fetch(fetchUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${API_KEY}`
           },
           body: JSON.stringify(reqBody)
       });

       const data = await response.json();
       if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));

       const imageUrl = data.data?.[0]?.url || data.url;
       const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: 1, resolution: targetSize }, req);
       return res.json({ success: true, imageUrl, estimatedCostUsd, raw: data });
    }

    // 可灵 Kling AI / 即梦 Jimeng (视频)
    if (model.includes('kling') || isVolcengineVideoModel(req.body.model, req.body.actionType) || (model.startsWith('ep-') && (req.body.model.includes('video') || req.body.model.includes('seedance') || req.body.model.includes('dance') || req.body.actionType === 'jimeng-video'))) {
       const isKling = model.includes('kling');
       const API_KEY = isKling ? runtimeKlingKey : runtimeJimengKey;
       
       let rawKlingUrl = runtimeKlingBaseUrl || "https://api.klingai.com/v1";
       rawKlingUrl = rawKlingUrl.trim().replace(/\/$/, '');
       // Fix user misconfiguration if they forgot /v1 for official kling API
       if (rawKlingUrl.includes('klingai.com') && !rawKlingUrl.includes('/v1')) {
           rawKlingUrl = `${rawKlingUrl}/v1`;
       }

       let rawJimengUrl = runtimeJimengBaseUrl || "https://ark.cn-beijing.volces.com/api/v3";
       rawJimengUrl = rawJimengUrl.trim().replace(/\/$/, '');
       if (rawJimengUrl.includes('ark.cn-beijing.volces.com') && !rawJimengUrl.includes('/api/v3')) {
           rawJimengUrl = `${rawJimengUrl}/api/v3`;
       }

       const BASE_URL = isKling ? rawKlingUrl : rawJimengUrl;
       
       if (!API_KEY) throw new Error(`网关未配置 ${isKling ? '可灵 (KLING)' : '即梦 (JIMENG)'} 所需的 API Key`);

       let tokenToUse = API_KEY;
       if (isKling && API_KEY) {
           // Provide safe net for official Kling AK/SK
           const parts = API_KEY.split(/[\.:\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('kling')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }

       let klingVideoPath = model.includes('o1') || model.includes('omni') ? 'omni-video' : 'text2video';
       if (isKling && req.body.referenceImage && !model.includes('o1') && !model.includes('omni')) {
           klingVideoPath = 'image2video';
       }

       let submitUrl = isKling ? `${BASE_URL.replace(/\/$/, '')}/videos/${klingVideoPath}` : `${BASE_URL.replace(/\/$/, '')}/contents/generations/tasks`;
       
       // Handle users putting exact endpoints into Base URL
       if (BASE_URL.includes('/videos/') || BASE_URL.includes('/tasks') || (!isKling && BASE_URL.includes('/video/'))) {
           submitUrl = BASE_URL.trim();
       }

       let seedanceResolution = req.body.videoResolution || req.body.resolution || "720p";
       if (!isKling && model.includes('fast') && seedanceResolution === '1080p') {
           seedanceResolution = '720p';
       }

       let klingActualModelName = model;
       if (model === 'kling') {
           klingActualModelName = "kling-v1-5";
       }

       let submitBody: any = {};
       
       if (isKling) {
           submitBody = {
               model_name: klingActualModelName,
               prompt: prompt,
           };
           
           // 可灵官方文档要求 duration 为 string："5" 或 "10"
           submitBody.duration = typeof req.body.duration !== 'undefined' ? String(req.body.duration) : "5";
           
           if (req.body.aspectRatio) {
               submitBody.aspect_ratio = req.body.aspectRatio;
           }
           if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';
           if (req.body.videoResolution === '720p') submitBody.mode = 'std';
           
           if (klingVideoPath === 'image2video' && req.body.referenceImage) {
               submitBody.image = req.body.referenceImage;
               if (req.body.referenceImageTail) submitBody.image_tail = req.body.referenceImageTail;
               
               
               // 官方部分接口 image2video 可能不支持 aspect_ratio，由原图决定，这里可选删除
               // delete submitBody.aspect_ratio;
           }
           submitBody.model = model; // For proxy compatibility
       } else {
           submitBody = {
               model: model,
               content: [
                   { type: "text", text: prompt }
               ],
               ratio: req.body.aspectRatio || "16:9",
               resolution: seedanceResolution,
               logo_info: { add_logo: false, is_logo_cleared: true },
               watermark: false
           };
           // 豆包/即梦 生成时长限制：如果模型版本需要控制
           let durationNum = typeof req.body.duration !== 'undefined' ? parseInt(req.body.duration) : 5;
           submitBody.duration = durationNum;
           
           if (req.body.referenceImage) {
               submitBody.content.unshift({
                   type: "image",
                   image_url: { url: req.body.referenceImage }
               });
           }
       }

       console.log("Sending request to:", submitUrl);
       console.log("Sending request to:", submitUrl);
       const submitResponse = await fetch(submitUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${tokenToUse}`
           },
           body: JSON.stringify(submitBody)
       });

       const submitData = await submitResponse.json();
       if (!submitResponse.ok) throw new Error(submitData.error?.message || JSON.stringify(submitData));

       const taskId = isKling ? (submitData.data?.task_id || submitData.task_id || submitData.id) : (submitData.id || submitData.task_id || submitData.data?.task_id);
       if (!taskId) throw new Error("未能获取任务 ID (Task ID not found)");

       console.log(`[Unified Gateway] Domestic Video Task submitted: ${taskId}. Polling...`);

       let finalVideoUrl = "";
       let startTime = Date.now();
       const TIMEOUT = 260000; // < 5 mins for cloudrun safety

       while (Date.now() - startTime < TIMEOUT) {
           await new Promise(r => setTimeout(r, 10000)); // 10秒轮询
           
           let pollUrl = isKling ? `${BASE_URL.replace(/\/$/, '')}/videos/${klingVideoPath}/${taskId}` : `${BASE_URL.replace(/\/$/, '')}/contents/generations/tasks/${taskId}`;
           
           if (BASE_URL.includes('/videos/')) { // Handles /videos/omni-video etc.
               // Handle standard overseas API proxy proxying
               pollUrl = `${BASE_URL.trim().replace(/\/text2video|\/omni-video/g, '/tasks')}/${taskId}`;
               if (BASE_URL.includes('/text2video') || BASE_URL.includes('/omni-video')) {
                   pollUrl = `${BASE_URL.trim()}/${taskId}`;
               }
           } else if (BASE_URL.includes('/tasks')) {
               pollUrl = `${BASE_URL.trim()}/${taskId}`;
           }

           const pollResponse = await fetch(pollUrl, {
               headers: { 'Authorization': `Bearer ${tokenToUse}` }
           });
           
           let pollData;
           let pollText = "";
           try {
               pollText = await pollResponse.text();
               pollData = JSON.parse(pollText);
           } catch(e) {
               console.error(`[Unified Gateway] Polling JSON error on ${pollUrl}: ${pollText.substring(0, 100)}...`);
               if (!pollResponse.ok) continue; // Just wait, maybe 502/HTML is intermittent
               throw new Error(`上游服务器解析错误 (Upstream format error): ${pollText.substring(0, 50)}`);
           }

           const status = isKling ? (pollData.data?.task_status || pollData.status || (pollData.data && pollData.data.status)) : (pollData.status || (pollData.data && pollData.data.status));
           const resultVideoUrl = isKling ? (pollData.data?.task_result?.videos?.[0]?.url || pollData.video_url || (pollData.data && (pollData.data.url || pollData.data.video_url))) : (pollData.content?.video_url || pollData.video_url || pollData.url || (pollData.data && (pollData.data.url || pollData.data.video_url || pollData.data.content?.video_url)));

           console.log(`[Unified Gateway] Domestic Video Task ${taskId} iter status: ${status}, videoUrl: ${resultVideoUrl ? 'YES' : 'NO'}`, pollData);

           if ((status === 'SUCCESS' || status === 'completed' || status === 'done' || status === 'succeeded' || status === 'succeed') && resultVideoUrl) {
               finalVideoUrl = resultVideoUrl;
               break;
           } else if (status === 'FAILURE' || status === 'failed') {
               throw new Error(`生成失败: ${pollData.error?.message || '任务状态异常'}`);
           }
           console.log(`[Unified Gateway] Domestic Video Task ${taskId} status: ${status}...`);
       }

       if (!finalVideoUrl) throw new Error("视频任务超时或未返回结果 (Task Timeout)");

       const estimatedCostUsd = recordBillingLog('video', model, prompt, { resolution: '720p' }, req);
       return res.json({ success: true, videoUrl: finalVideoUrl, estimatedCostUsd, raw: { taskId } });
    }

    // Gemini 图像路线 (Imagen / Nano Banana)
    if (model.includes('imagen') || model.includes('image')) {
       let rawBase64 = null;
       const ai = getAI();
       
       if (model.includes('imagen')) {
           // Imagen 系列使用 generateImages
           const response = await ai.models.generateImages({
               model: model,
               prompt: prompt,
               config: {
                   numberOfImages: 1,
                   outputMimeType: 'image/jpeg',
                   aspectRatio: req.body.aspectRatio || "1:1"
               }
           });
           rawBase64 = response.generatedImages?.[0]?.image?.imageBytes;
       } else {
           // Nano Banana 系列使用 generateContent
           const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
           if (req.body.referenceImage) {
               const { mimeType, data } = parseDataUri(req.body.referenceImage);
               contents[0].parts.unshift({ inlineData: { mimeType, data } });
           }
           
           const response = await ai.models.generateContent({
             model: model,
             contents: contents,
             config: {
               imageConfig: {
                 aspectRatio: req.body.aspectRatio || "1:1",
                 imageSize: req.body.imageSize || "1K"
               }
             }
           });
           
           const parts = response.candidates?.[0]?.content?.parts;
           if (parts) {
               for (const part of parts) {
                   if (part.inlineData) {
                       rawBase64 = part.inlineData.data;
                       break;
                   }
               }
           }
       }
       
       const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: 1, resolution: '2K' }, req);
       
       return res.json({ success: true, imageUrl: rawBase64 ? `data:image/jpeg;base64,${rawBase64}` : null, estimatedCostUsd });
    }

    // 默认 fallback (Gemini 文本路线)
    const parts: any[] = [{ text: prompt }];
    if (req.body.referenceImage) {
        const { mimeType, data } = parseDataUri(req.body.referenceImage);
        parts.push({ inlineData: { mimeType, data } });
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: parts
    });
    
    const outputText = response.text || "";
    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const estimatedCostUsd = recordBillingLog('chat', model, prompt, { inputTokens: promptTokens, outputTokens: candidatesTokens }, req);
    
    recordDispatchLog(true, "/api/v1/generate", model, "Gemini Request Success", req.body, req, { text: outputText });
    
    return res.json({ success: true, text: outputText, estimatedCostUsd, raw: response });

  } catch (error: any) {
    console.error("Unified Router API Error:", error);
    recordDispatchLog(false, "/api/v1/generate", req.body?.model, "fetch failed: " + (typeof submitUrl !== 'undefined' ? submitUrl : "unknown URL") + " - " + error.message, Object.keys(error).length === 0 ? error.message : error, req);
    res.status(500).json({ success: false, error: error.message || "内部服务错误" });
  }
});

// 当用户/开发者在浏览器直接打开（GET请求）时的友好提示
app.get("/api/chat", (req, res) => {
  res.status(405).json({ error: "方法不允许 (Method Not Allowed)", message: "这是一个 POST 接口，不能在浏览器里直接访问（浏览器默认是 GET）。请用代码发 POST 请求。" });
});
app.get("/api/image", (req, res) => {
  res.status(405).json({ error: "方法不允许 (Method Not Allowed)", message: "这是一个 POST 接口，不能在浏览器里直接访问。请用代码发 POST 请求。" });
});
app.get("/api/video", (req, res) => {
  res.status(405).json({ error: "方法不允许 (Method Not Allowed)", message: "这是一个 POST 接口，不能在浏览器里直接访问。请用代码发 POST 请求。" });
});

// ==========================================
// 3.5 OpenAI Standard Compatible Endpoints (为国内各类矩阵/工作流引擎提供标准接入)
// ==========================================

app.post(["/v1/chat/completions", "/api/v1/chat/completions", "/v1/v1/chat/completions"], requireAuth, async (req, res) => {
  try {
    let { model, messages, temperature, max_tokens, stream } = req.body;
    
    // 映射模型名称
    model = mapModelName(model);
    
    // 如果是 gemini 模型，转换为 gemini 格式并调用
    if (model && model.includes('gemini')) {
      const ai = getAI();
      const geminiContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
      }));
      
      const response = await ai.models.generateContent({
        model: model,
        contents: geminiContents,
        config: {
          temperature: typeof temperature === 'number' ? temperature : undefined,
          maxOutputTokens: max_tokens
        }
      });
      
      const responseText = response.text || "";
      const estimatedCostUsd = recordBillingLog('chat', model, "Standard /v1/chat/completions call", { inputTokens: 0, outputTokens: 0 }, req);
      
      recordDispatchLog(true, "/v1/chat/completions", model, "Gemini Request Success", req.body, req, { text: responseText });

      return res.json({
        id: "chatcmpl-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: responseText },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });
    }

    // 若不是 gemini 模型，则透传给 OpenAI 兼容后端
    let API_KEY = runtimeOpenaiKey;
    let BASE_URL = runtimeOpenaiBaseUrl || "https://api.openai.com/v1";

    if (model.includes('deepseek')) {
       API_KEY = runtimeDeepseekKey;
       BASE_URL = runtimeDeepseekBaseUrl || "https://api.deepseek.com";
    }

    if (!API_KEY) throw new Error(`网关未配置 ${model} 所需的 API Key (未提供对应平台的 Key)`);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData);
    }
    
    const data = await response.json();
    recordDispatchLog(true, "/v1/chat/completions", req.body?.model, "Pass-through Success", req.body, req, data);
    return res.status(response.status).json(data);

  } catch (error: any) {
    console.error("[OpenAI Compatible API] v1/chat/completions Error:", error);
    recordDispatchLog(false, "/v1/chat/completions", req.body?.model, error.message || "内部服务错误", error, req);
    res.status(500).json({ error: { message: error.message || "内部服务错误", type: "server_error" } });
  }
});

app.get(["/v1/models", "/api/v1/models", "/v1/v1/models"], requireAuth, async (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "gemini-1.5-pro", object: "model", created: 1686935002, owned_by: "google" },
      { id: "gemini-1.5-flash", object: "model", created: 1686935002, owned_by: "google" },
      { id: "gemini-3.1-pro-preview", object: "model", created: 1686935002, owned_by: "google" },
      { id: "gemini-3.1-flash-preview", object: "model", created: 1686935002, owned_by: "google" },
      { id: "gemini-3.1-flash-image-preview", object: "model", created: 1686935002, owned_by: "google" },
      { id: "dall-e-3", object: "model", created: 1686935002, owned_by: "openai" },
      { id: "gpt-4o", object: "model", created: 1686935002, owned_by: "openai" },
      { id: "gpt-4o-mini", object: "model", created: 1686935002, owned_by: "openai" },
    ]
  });
});

app.post(["/v1/images/generations", "/api/v1/images/generations", "/v1/v1/images/generations"], mediaConcurrencyLimiter, requireAuth, async (req, res) => {
  try {
    let { prompt, model = "dall-e-3", n = 1, size = "1024x1024", response_format = "url" } = req.body;
    
    // 映射模型名称
    model = mapModelName(model);
    
    // 标准化尺寸识别 (Standardize size recognition)
    const rawSize = (req.body.size || req.body.imageSize || req.body.image_size || '1024x1024').toString().toLowerCase();
    let geminiImageSize = '1K';
    if (rawSize.includes('2048') || rawSize === '2k') geminiImageSize = '2K';
    else if (rawSize.includes('4096') || rawSize === '4k') geminiImageSize = '4K';
    else if (rawSize.includes('512') || rawSize === 'small') geminiImageSize = '512';
    else geminiImageSize = '1K';

    // OpenAI 尺寸规范化 (DALL-E 3 仅支持 1024 或 1792)
    if (model && (model.includes('dall-e') || model.includes('gpt-image'))) {
        if (model.includes('dall-e-3')) n = 1; // DALL-E 3 only supports n=1
        if (size.includes('x')) {
            const [w, h] = size.split('x').map(Number);
            if (w > 1792 || h > 1792) {
                // 维持比例但限制在 1792/1024 档位
                if (w > h * 1.2) size = "1792x1024";
                else if (h > w * 1.2) size = "1024x1792";
                else size = "1024x1024";
            }
        } else if (size === '4K' || size === '2K') {
            size = "1024x1024";
        }
    }
    
    // 如果是 gemini 图像模型
    if (model && model.includes('gemini')) {
      const ai = getAI();
      let reqAspectRatio = req.body.aspectRatio || req.body.aspect_ratio || "1:1";
      if (!req.body.aspectRatio && !req.body.aspect_ratio && size.includes('x')) {
          const parts = size.split('x');
          const w = parseInt(parts[0]);
          const h = parseInt(parts[1]);
          if (w > h * 1.5) reqAspectRatio = "16:9";
          else if (h > w * 1.5) reqAspectRatio = "9:16";
          else if (w > h) reqAspectRatio = "4:3";
          else if (h > w) reqAspectRatio = "3:4";
      }

      const contents: any[] = [{ role: 'user', parts: [] }];
      if (prompt) {
          contents[0].parts.push({ text: prompt });
      }
      const refImg = req.body.referenceImage || req.body.image || req.body.init_image;
      if (refImg) {
          let finalData = "";
          let finalMimeType = "image/jpeg";
          if (typeof refImg === 'string') {
              if (refImg.startsWith("http://") || refImg.startsWith("https://")) {
                  try {
                      const imgRes = await fetch(refImg);
                      if (imgRes.ok) {
                          const arrayBuffer = await imgRes.arrayBuffer();
                          finalData = Buffer.from(arrayBuffer).toString('base64');
                          finalMimeType = imgRes.headers.get('content-type') || "image/jpeg";
                      }
                  } catch (err: any) {}
              } else {
                  const parsed = parseDataUri(refImg);
                  finalMimeType = parsed.mimeType;
                  finalData = parsed.data;
              }
              if (finalData) {
                  contents[0].parts.unshift({ inlineData: { mimeType: finalMimeType, data: finalData } });
              }
          }
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: { imageConfig: { aspectRatio: reqAspectRatio, imageSize: geminiImageSize } as any }
      });
      
      let base64Image = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }
      if (!base64Image) throw new Error("图片生成失败，模型未返回图像数据。");
      
      const resultItem: any = {};
      if (response_format === "b64_json") {
        resultItem.b64_json = base64Image;
      } else {
        resultItem.url = `data:image/jpeg;base64,${base64Image}`;
      }

      const resultData = { data: [resultItem] };
      recordDispatchLog(true, "/v1/images/generations", model, "Gemini Image Success", req.body, req, resultData);

      return res.json({
        created: Math.floor(Date.now() / 1000),
        data: [resultItem]
      });
    }
    
    // 可灵 Kling AI / 即梦 Jimeng (视频) 透传支持
    if (model.includes('kling') || isVolcengineVideoModel(req.body.model, req.body.actionType) || (model.startsWith('ep-') && (req.body.model.includes('video') || req.body.model.includes('seedance') || req.body.model.includes('dance') || req.body.actionType === 'jimeng-video'))) {
       const isKling = model.includes('kling');
       const API_KEY = isKling ? runtimeKlingKey : runtimeJimengKey;
       
       let rawKlingUrl = runtimeKlingBaseUrl || "https://api.klingai.com/v1";
       rawKlingUrl = rawKlingUrl.trim().replace(/\/$/, '');
       if (rawKlingUrl.includes('klingai.com') && !rawKlingUrl.includes('/v1')) {
           rawKlingUrl = `${rawKlingUrl}/v1`;
       }

       let rawJimengUrl = runtimeJimengBaseUrl || "https://ark.cn-beijing.volces.com/api/v3";
       rawJimengUrl = rawJimengUrl.trim().replace(/\/$/, '');
       if (rawJimengUrl.includes('ark.cn-beijing.volces.com') && !rawJimengUrl.includes('/api/v3')) {
           rawJimengUrl = `${rawJimengUrl}/api/v3`;
       }

       const BASE_URL = isKling ? rawKlingUrl : rawJimengUrl;
       if (!API_KEY) throw new Error(`网关未配置 ${isKling ? '可灵 (KLING)' : '即梦 (JIMENG)'} 所需的 API Key`);

       let tokenToUse = API_KEY;
       if (isKling && API_KEY) {
           const parts = API_KEY.split(/[\.:\|]/);
           if (parts.length === 2 && !API_KEY.startsWith('eyJ') && !API_KEY.startsWith('sk-') && BASE_URL.includes('kling')) {
               tokenToUse = generateKlingJwt(parts[0], parts[1]);
           }
       }

       let klingVideoPath = model.includes('o1') || model.includes('omni') ? 'omni-video' : 'text2video';
       let submitUrl = isKling ? `${BASE_URL.replace(/\/$/, '')}/videos/${klingVideoPath}` : `${BASE_URL.replace(/\/$/, '')}/contents/generations/tasks`;
       
       if (BASE_URL.includes('/videos/') || BASE_URL.includes('/tasks') || (!isKling && BASE_URL.includes('/video/'))) {
           submitUrl = BASE_URL.trim();
       }

       let seedanceResolution = req.body.videoResolution || req.body.resolution || "720p";
       if (!isKling && model.includes('fast') && seedanceResolution === '1080p') {
           seedanceResolution = '720p';
       }

       let klingActualModelName = model;
       if (model === 'kling') {
           klingActualModelName = "kling-v1-5";
       }

       let submitBody: any = isKling ? {
            model_name: klingActualModelName,
            prompt: prompt,
            aspect_ratio: req.body.aspectRatio || req.body.aspect_ratio || "16:9",
            duration: typeof req.body.duration !== 'undefined' ? parseInt(req.body.duration) : 5
        } : {
            model: model,
            content: [ { type: "text", text: prompt } ],
            ratio: req.body.aspectRatio || req.body.aspect_ratio || "16:9",
            resolution: seedanceResolution,
            duration: typeof req.body.duration !== 'undefined' ? parseInt(req.body.duration) : 5,
            logo_info: { add_logo: false, is_logo_cleared: true },
            watermark: false
        };

        if (isKling) {
            submitBody.model = model;
        }

       const submitResponse = await fetch(submitUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${tokenToUse}`
           },
           body: JSON.stringify(submitBody)
       });

       const submitData = await submitResponse.json();
       if (!submitResponse.ok) throw new Error(submitData.error?.message || JSON.stringify(submitData));

       const taskId = isKling ? (submitData.data?.task_id || submitData.task_id || submitData.id) : (submitData.id || submitData.task_id || submitData.data?.task_id);
       if (!taskId) throw new Error("未能获取任务 ID (Task ID not found)");

       let finalVideoUrl = "";
       let startTime = Date.now();
       const TIMEOUT = 260000;

       while (Date.now() - startTime < TIMEOUT) {
           await new Promise(r => setTimeout(r, 10000));
           
           let pollUrl = isKling ? `${BASE_URL.replace(/\/$/, '')}/videos/${klingVideoPath}/${taskId}` : `${BASE_URL.replace(/\/$/, '')}/contents/generations/tasks/${taskId}`;
           if (BASE_URL.includes('/videos/')) {
               pollUrl = `${BASE_URL.trim().replace(/\/text2video|\/omni-video/g, '/tasks')}/${taskId}`;
               if (BASE_URL.includes('/text2video') || BASE_URL.includes('/omni-video')) { pollUrl = `${BASE_URL.trim()}/${taskId}`; }
           } else if (BASE_URL.includes('/tasks')) {
               pollUrl = `${BASE_URL.trim()}/${taskId}`;
           }

           const pollResponse = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${tokenToUse}` } });
           
           let pollData;
           let pollText = "";
           try {
               pollText = await pollResponse.text();
               pollData = JSON.parse(pollText);
           } catch(e) {
               console.error(`[Unified Gateway - OpenAI] Polling JSON error on ${pollUrl}: ${pollText.substring(0, 100)}...`);
               if (!pollResponse.ok) continue;
               throw new Error(`上游服务器解析错误 (Upstream format error): ${pollText.substring(0, 50)}`);
           }

           const status = isKling ? (pollData.data?.task_status || pollData.status || (pollData.data && pollData.data.status)) : (pollData.status || (pollData.data && pollData.data.status));
           const resultVideoUrl = isKling ? (pollData.data?.task_result?.videos?.[0]?.url || pollData.video_url || (pollData.data && (pollData.data.url || pollData.data.video_url))) : (pollData.content?.video_url || pollData.video_url || pollData.url || (pollData.data && (pollData.data.url || pollData.data.video_url || pollData.data.content?.video_url)));

           console.log(`[Unified Gateway] Domestic Video Task ${taskId} iter status: ${status}, videoUrl: ${resultVideoUrl ? 'YES' : 'NO'}`, pollData);

           if ((status === 'SUCCESS' || status === 'completed' || status === 'done' || status === 'succeeded' || status === 'succeed') && resultVideoUrl) {
               finalVideoUrl = resultVideoUrl;
               break;
           } else if (status === 'FAILURE' || status === 'failed') {
               throw new Error(`生成失败: ${pollData.error?.message || '任务状态异常'}`);
           }
       }

       if (!finalVideoUrl) throw new Error("视频生成超时");
       
       const resultData = { created: Math.floor(Date.now() / 1000), data: [{ url: finalVideoUrl }] };
       recordDispatchLog(true, "/v1/images/generations", model, "Video API success returning as Image API format", req.body, req, resultData);
       return res.json(resultData);
    }
    
    // 即梦 Jimeng (图像) / 豆包 Seedream
    if (isVolcengineImageModel(req.body.model, req.body.actionType) || (model.startsWith('ep-') && !req.body.model.includes('video') && !req.body.model.includes('seedance') && !req.body.model.includes('dance') && req.body.actionType !== 'jimeng-video')) {
       const API_KEY = runtimeJimengKey;
       let BASE_URL = runtimeJimengBaseUrl || "https://ark.cn-beijing.volces.com/api/v3";
       BASE_URL = BASE_URL.trim().replace(/\/$/, '');
       if (BASE_URL.includes('ark.cn-beijing.volces.com') && !BASE_URL.includes('/api/v3')) {
           BASE_URL = `${BASE_URL}/api/v3`;
       }
       if (!API_KEY) throw new Error(`网关未配置火山引擎 (即梦/豆包) 所需的 API Key`);

       let jimengMappedSize = size;
       const originalModel = req.body.model || '';
       if (originalModel.includes('5-0') || originalModel.includes('5.0') || originalModel.includes('4-5') || originalModel.includes('4.5') || model === "ep-20260511162417-9xd8q" || model === "ep-20260511162504-fjd6v") {
           const parts = size.split('x');
           if (parts.length === 2) {
               let w = parseInt(parts[0]);
               let h = parseInt(parts[1]);
               const aspect = w / h;
               if (w * h < 3686400) {
                   h = Math.ceil(Math.sqrt(4194304 / aspect));
                   w = Math.ceil(h * aspect);
                   w = Math.ceil(w / 32) * 32;
                   h = Math.ceil(h / 32) * 32;
                   jimengMappedSize = `${w}x${h}`;
               }
           }
       }
       let reqBodyVolc: any = {
           model: model,
           prompt: prompt,
           size: jimengMappedSize,
           logo_info: { add_logo: false, is_logo_cleared: true },
           watermark: false
       };

       let refImg = req.body.referenceImage || req.body.image || req.body.init_image;
       if (refImg && typeof refImg === 'string' && refImg.startsWith('data:')) {
           reqBodyVolc.image = refImg;
       }

       let fetchUrl = BASE_URL.trim().replace(/\/$/, '');
       if (!fetchUrl.endsWith('/images/generations')) {
           fetchUrl = `${fetchUrl}/images/generations`;
       }

       const response = await fetch(fetchUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${API_KEY}`
           },
           body: JSON.stringify(reqBodyVolc)
       });

       const data = await response.json();
       if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));

       const imageUrl = data.data?.[0]?.url || data.url;
       
       const resultItem: any = {};
       if (response_format === "b64_json") {
           resultItem.b64_json = data.data?.[0]?.b64_json || imageUrl; // Best effort if not b64 directly returned
       } else {
           resultItem.url = imageUrl;
       }

       const resultData = { created: Math.floor(Date.now() / 1000), data: [resultItem] };
       recordDispatchLog(true, "/v1/images/generations", model, "Volcengine Image API success", req.body, req, resultData);
       return res.json(resultData);
    }
    
    // 第三方透传 (Midjourney, Flux, OpenAI 等) 走已有的 Omni Router 类似逻辑映射
    let isMidjourney = model.includes('midjourney') || model.includes('mj');
    let isFlux = model.includes('flux');
    let API_KEY = runtimeOpenaiKey;
    let BASE_URL = runtimeOpenaiBaseUrl || "https://api.openai.com/v1";

    if (isMidjourney && runtimeMidjourneyKey) { API_KEY = runtimeMidjourneyKey; }
    if (isMidjourney && runtimeMidjourneyBaseUrl) { BASE_URL = runtimeMidjourneyBaseUrl; }
    if (isFlux && runtimeFluxKey) { API_KEY = runtimeFluxKey; }
    if (isFlux && runtimeFluxBaseUrl) { BASE_URL = runtimeFluxBaseUrl; }

    if (!API_KEY) throw new Error(`网关未配置 ${model} 所需的 API Key`);

    // 对于普通 OpenAI 兼容的 API 接口，直接向后透传
    // 注意：清理掉非标准参数 (如 aspectRatio, referenceImage 等)，防止上游网关报错 400
    const { 
        aspectRatio, aspect_ratio, 
        imageSize, image_size, size: _, 
        referenceImage, image, init_image,
        numberOfImages,
        ...openaiBody 
    } = req.body;
    
    // 重新构造符合标准 OpenAI 格式的 body
    const finalBody: any = {
        ...openaiBody,
        model: model,
        prompt: prompt,
        n: n,
        size: size
    };
    
    // 兼容部分 API (如 SiliconFlow/矩阵) 不支持 response_format 的情况
    if (response_format && response_format !== 'url') {
        finalBody.response_format = response_format;
    }

    const response = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(finalBody)
    });
    
    if (!response.ok) {
        let errData = await response.text();
        try { errData = JSON.parse(errData); } catch(e) {}
        return res.status(response.status).json((errData as any).error ? errData : { error: { message: typeof errData === 'string' ? errData : JSON.stringify(errData), type: "upstream_error" } });
    }
    
    const data = await response.json();
    recordDispatchLog(true, "/v1/images/generations", req.body?.model, "Pass-through Success", req.body, req, data);
    return res.status(response.status).json(data);

  } catch (error: any) {
    console.error("[OpenAI Compatible API] v1/images/generations Error:", error);
    recordDispatchLog(false, "/v1/images/generations", req.body?.model, error.message || "内部服务错误", error, req);
    res.status(500).json({ error: { message: error.message || "内部服务错误", type: "server_error" } });
  }
});

// A. 文本问答 (Text Chat) - 已增强多模态支持
app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    let { 
      prompt, 
      model = "gemini-2.5-pro", 
      systemInstruction,
      temperature,
      images = [] // 支持传入多张 base64 图片数组作为视觉输入
    } = req.body;
    
    // 映射模型名称
    model = mapModelName(model);
    
    if (!prompt) return res.status(400).json({ error: "缺少 prompt 参数 (Missing prompt)" });

    console.log(`[API] Text Chat requesting model: ${model}`);
    
    // 构建多模态内容体 (Multimodal Parts)
    const parts: any[] = [{ text: prompt }];

    // 允许客户上传图片，触发 Gemini 的多模态能力 (视觉识别)
    if (images && Array.isArray(images)) {
      for (const imgBase64 of images) {
        let finalData = "";
        let finalMimeType = "image/jpeg";
        if (imgBase64.startsWith("http://") || imgBase64.startsWith("https://")) {
            console.log("Fetching chat image from URL:", imgBase64);
            try {
                const imgRes = await fetch(imgBase64);
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  finalData = Buffer.from(arrayBuffer).toString('base64');
                  finalMimeType = imgRes.headers.get('content-type') || "image/jpeg";
                }
            } catch (err: any) {
                console.error("Error fetching chat image URL:", err.message);
            }
        } else {
          const parsed = parseDataUri(imgBase64);
          finalMimeType = parsed.mimeType;
          finalData = parsed.data;
        }

        if (finalData) {
          parts.push({
            inlineData: {
              mimeType: finalMimeType,
              data: finalData
            }
          });
        }
      }
    }

    // 构建模型的高级控制参数
    const config: any = {};
    if (systemInstruction) config.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (typeof temperature === 'number') config.temperature = temperature;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: parts, // 发送多模态混合包裹
      config: Object.keys(config).length > 0 ? config : undefined
    });

    const outputText = response.text || "";
    if (!isContentSafe(outputText)) {
      return res.status(403).json({ error: "生成结果包含敏感内容，已被拦截。" });
    }

    // Capture Token usage and record bill
    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const estimatedCostUsd = recordBillingLog('chat', model, prompt, { inputTokens: promptTokens, outputTokens: candidatesTokens }, req);

    recordDispatchLog(true, "/api/chat", model, "Chat Request Success", req.body, req);

    res.json({ success: true, text: outputText, estimatedCostUsd, raw: response });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    recordDispatchLog(false, "/api/chat", req.body?.model, error.message || "内部服务错误", error, req);
    res.status(500).json({ success: false, error: error.message || "内部服务错误" });
  }
});

// B. 图片生成 (Image Generation) - 已增强高级参数及参考图设置
app.post("/api/image", heavyLimiter, mediaConcurrencyLimiter, requireAuth, async (req, res) => {
  try {
    let { 
      prompt, 
      model = "gemini-1.5-flash", 
      aspectRatio = "1:1", 
      imageSize,
      numberOfImages = 1, 
      personGeneration = "ALLOW_ALL", 
      referenceImage 
    } = req.body;

    // 映射模型名称
    model = mapModelName(model);

    // 尺寸规范化
    const rawSize = (imageSize || req.body.image_size || req.body.size || '1K').toString().toUpperCase();
    if (rawSize.includes('4K') || rawSize.includes('4096')) {
        imageSize = '4K';
    } else if (rawSize.includes('2K') || rawSize.includes('2048')) {
        imageSize = '2K';
    } else if (rawSize.includes('512')) {
        imageSize = '512';
    } else {
        imageSize = '1K';
    }

    if (!prompt) return res.status(400).json({ error: "缺少 prompt 参数 (Missing prompt)" });

    console.log(`[API] Image Generation requesting model: ${model}, aspect: ${aspectRatio}`);

    // 重组请求包体 (支持垫图输入)
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    let finalData = "";
    let finalMimeType = "image/jpeg";
    if (referenceImage) {
        if (referenceImage.startsWith("http://") || referenceImage.startsWith("https://")) {
            console.log("Fetching reference image from URL:", referenceImage);
            try {
                const imgRes = await fetch(referenceImage);
                if (!imgRes.ok) throw new Error("Failed to fetch image: " + imgRes.statusText);
                const arrayBuffer = await imgRes.arrayBuffer();
                finalData = Buffer.from(arrayBuffer).toString('base64');
                finalMimeType = imgRes.headers.get('content-type') || "image/jpeg";
            } catch (err: any) {
                console.error("Error fetching referenceImage URL:", err.message);
                throw new Error("Cannot fetch referenceImage: " + err.message);
            }
        } else {
            const parsed = parseDataUri(referenceImage);
            finalMimeType = parsed.mimeType;
            finalData = parsed.data;
        }

        // 将用户上传的垫图作为视觉输入给到模型
        contents[0].parts.unshift({
            inlineData: { mimeType: finalMimeType, data: finalData }
        });
    }

    if (isVolcengineImageModel(req.body.model, req.body.actionType) || (model.startsWith('ep-') && !req.body.model.includes('video') && !req.body.model.includes('seedance') && req.body.actionType !== 'jimeng-video')) {
       const API_KEY = runtimeJimengKey;
       let BASE_URL = runtimeJimengBaseUrl || "https://ark.cn-beijing.volces.com/api/v3";
       BASE_URL = BASE_URL.trim().replace(/\/$/, '');
       if (BASE_URL.includes('ark.cn-beijing.volces.com') && !BASE_URL.includes('/api/v3')) {
           BASE_URL = `${BASE_URL}/api/v3`;
       }
       if (!API_KEY) throw new Error(`网关未配置火山引擎 (即梦/豆包) 所需的 API Key`);

       let jimengMappedSize = imageSize === '512' ? '512x512' : (imageSize === '2K' ? '2048x2048' : (imageSize === '4K' ? '4096x2304' : '1024x1024'));
       const originalModel = req.body.model || '';
       if (originalModel.includes('5-0') || originalModel.includes('5.0') || originalModel.includes('4-5') || originalModel.includes('4.5') || model === "ep-20260511162417-9xd8q" || model === "ep-20260511162504-fjd6v") {
           if (jimengMappedSize === '1024x1024' || jimengMappedSize === '512x512') {
               jimengMappedSize = '2048x2048'; // Minimum required by seedream-5 and 4.5
           }
       }
       let reqBody: any = {
           model: model,
           prompt: prompt,
           size: jimengMappedSize,
           logo_info: { add_logo: false, is_logo_cleared: true },
           watermark: false
       };
       if (referenceImage) {
           reqBody.image = `data:${finalMimeType};base64,${finalData}`;
       }

       let fetchUrl = BASE_URL.trim().replace(/\/$/, '');
       if (!fetchUrl.endsWith('/images/generations')) {
           fetchUrl = `${fetchUrl}/images/generations`;
       }

       const response = await fetch(fetchUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${API_KEY}`
           },
           body: JSON.stringify(reqBody)
       });

       const data = await response.json();
       if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));

       const imageUrl = data.data?.[0]?.url || data.url;
       const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: 1, resolution: reqBody.size }, req);
       recordDispatchLog(true, "/api/image", model, "Image Request Success", req.body, req);
       return res.json({ success: true, imageUrl, estimatedCostUsd, raw: data });
    }

    const ai = getAI();
    let base64Image = null;
    
    try {
      if (model.includes("imagen")) {
        const imageRes = await ai.models.generateImages({
          model: model,
          prompt: prompt,
          config: {
            numberOfImages: numberOfImages > 0 ? numberOfImages : 1,
            aspectRatio: aspectRatio,
            outputMimeType: 'image/jpeg'
          }
        });
        const rawBase64 = imageRes.generatedImages?.[0]?.image?.imageBytes;
        if (rawBase64) {
          base64Image = `data:image/jpeg;base64,${rawBase64}`;
        }
      } else {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio, 
              imageSize: imageSize,
              numberOfImages: numberOfImages > 0 ? numberOfImages : 1
            } as any
          }
        });
        
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              base64Image = `data:image/jpeg;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      }
    } catch(err: any) {
      console.error("DEBUG generate error details:", err);
      throw err;
    }

    if (!base64Image) {
      return res.status(500).json({ success: false, error: "图片生成失败，模型未返回图像数据。" });
    }

    // Record billowing
    const estimatedCostUsd = recordBillingLog('image', model, prompt, { imageCount: numberOfImages, resolution: imageSize }, req);

    recordDispatchLog(true, "/api/image", model, "Image Request Success", req.body, req);

    res.json({ success: true, imageUrl: base64Image, estimatedCostUsd });
  } catch (error: any) {
    console.error("Image API Error:", error);
    recordDispatchLog(false, "/api/image", req.body?.model, error.message || "内部服务错误", error, req);
    res.status(500).json({ success: false, error: error.message || "内部服务错误" });
  }
});

// C. 视频生成 (Video Generation - 注意：这是异步任务)
app.post("/api/video", heavyLimiter, mediaConcurrencyLimiter, requireAuth, async (req, res) => {
  try {
    let { 
      prompt, 
      model = "veo-2.0-generate-001", // 默认视频模型
      aspectRatio = "16:9",
      resolution = "1080p",
      personGeneration = "ALLOW_ALL"
    } = req.body;
    
    // 模型映射
    if (model && model.includes('veo-3.1')) {
        model = "veo-2.0-generate-001";
    }
    
    if (!prompt) return res.status(400).json({ error: "缺少 prompt 参数" });

    const ai = getAI();
    // Video generation takes time. Start it up.
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        // resolution removed since 1080p causes invalid argument error
        aspectRatio: aspectRatio,
        personGeneration: personGeneration // 如果有需要
      }
    });

    // Wait synchronously for it to finish (Cloud Run HTTP timeout allows up to 60m but standard might be less)
    console.log(`[API] Started video generation operation: ${operation.name}. Waiting for completion...`);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    // We return the raw Google Cloud Storage URL. 
    // Usually fetching it requires the API key. We will proxy the download dynamically or provide download URL.
    // For simplicity, we proxy the video buffer back to Aliyun.
    if (!downloadLink) {
        return res.status(500).json({ success: false, error: "视频生成失败，模型未返回视频链接。" });
    }

    console.log(`[API] Video generated at URI: ${downloadLink}, fetching...`);
    const apiKey = process.env.GEMINI_API_KEY || "";
    const videoResponse = await fetch(downloadLink, {
      method: "GET",
      headers: {
         "x-goog-api-key": apiKey
      }
    });

    if (!videoResponse.ok) {
       return res.status(500).json({ success: false, error: `获取视频内容失败: ${videoResponse.statusText}` });
    }

    // We send base64 back, which is easier for remote script to save as .mp4
    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const videoBase64 = `data:video/mp4;base64,${buffer.toString('base64')}`;

    // Record billing
    const estimatedCostUsd = recordBillingLog('video', model, prompt, { resolution }, req);

    recordDispatchLog(true, "/api/video", model, "Video Request Started", req.body, req);

    res.json({ success: true, videoUrl: videoBase64, estimatedCostUsd });
  } catch (error: any) {
    console.error("Video API Error:", error);
    recordDispatchLog(false, "/api/video", req.body?.model, error.message || "内部服务错误", error, req);
    res.status(500).json({ success: false, error: error.message || "内部服务错误" });
  }
});

// D. OpenAI (ChatGPT) 接口接入示范 - 已增强多模态支持
app.post("/api/openai", requireAuth, async (req, res) => {
  try {
    const { 
      prompt, 
      model = "gpt-4o-mini", 
      systemInstruction, 
      temperature, 
      images = [] // base64 数组
    } = req.body;
    
    if (!prompt) return res.status(400).json({ error: "缺少 prompt 参数" });

    // 使用热重载后的 runtime 密钥
    let key = runtimeOpenaiKey;
    let baseUrl = runtimeOpenaiBaseUrl || "https://api.openai.com/v1";

    if (model.includes('deepseek')) {
      key = runtimeDeepseekKey;
      baseUrl = runtimeDeepseekBaseUrl || "https://api.deepseek.com";
    }

    if (!key) {
      return res.status(400).json({ error: `网关未配置 ${model} 所需的 API Key。请在【控制面板】填写此密钥。` });
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    // 组装用户的消息体 (可能带图片)
    if (images && Array.isArray(images) && images.length > 0) {
      const contentParts: any[] = [{ type: "text", text: prompt }];
      images.forEach((imgDataUri: string) => {
        // OpenAI 支持直接接收 data:image/jpeg;base64,... 作为 url
        contentParts.push({ type: "image_url", image_url: { url: imgDataUri } });
      });
      messages.push({ role: "user", content: contentParts });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const openai = new OpenAI({ 
      apiKey: key,
      baseURL: baseUrl 
    });
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages as any,
      temperature: typeof temperature === 'number' ? temperature : undefined
    });

    // Extract OpenAI token usage
    const inTokens = response.usage?.prompt_tokens || 0;
    const outTokens = response.usage?.completion_tokens || 0;
    const estimatedCostUsd = recordBillingLog('chat', model, prompt, { inputTokens: inTokens, outputTokens: outTokens }, req);

    recordDispatchLog(true, "/api/openai", model, "OpenAI Pass-through Success", req.body, req);

    const msgResponse = response.choices[0]?.message as any;
    let textOut = msgResponse?.content || "";
    
    // DeepSeek reasoning support
    if (msgResponse?.reasoning_content) {
      textOut = `> **思考过程 (Reasoning):**\n> \n> ${msgResponse.reasoning_content.replace(/\n/g, '\n> ')}\n\n---\n\n${textOut}`;
    }

    res.json({
      success: true,
      text: textOut,
      estimatedCostUsd,
      raw: response
    });
  } catch (error: any) {
    console.error("[API] OpenAI Error:", error);
    recordDispatchLog(false, "/api/openai", req.body?.model, error.message || "OpenAI 请求失败", error, req);
    res.status(500).json({ error: error.message || "OpenAI 请求失败" });
  }
});

// ==========================================
// 4. Vite Frontend Middleware
// ==========================================

// 拦截所有其他以 /api 开头但没匹配到的请求，强制返回 JSON 错误，防止 Vite 接管并返回 HTML
app.all("/api/*", (req, res) => {
  console.log(`[404 API Route Not Found] ${req.method} ${req.path}`);
  res.status(404).json({
    error: "接口地址没找到 (API route not found)",
    detail: `你请求了 ${req.method} ${req.path}，但系统中没有这个接口。请检查地址是否写错，或者请求方法（POST/GET）是否错误。`
  });
});

app.all("/v1/*", (req, res) => {
  console.log(`[404 v1 Route Not Found] ${req.method} ${req.path}`);
  res.status(404).json({
    error: { message: `Invalid URL (POST ${req.path})`, type: "invalid_request_error" }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Overseas API Server proxy running on http://localhost:${PORT}`);
  });
}

startServer();
