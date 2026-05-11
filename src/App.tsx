import React, { useState, useEffect } from 'react';
import { Copy, Check, Terminal, FileCode, Coffee, Play, Image as ImageIcon, MessageSquare, Video, Info, AlertTriangle, ExternalLink, Bot, Server, Shield, Download, Trash2, Plus, Upload, Search } from 'lucide-react';

const CodeBlock = ({ title, code }: { title: string, code: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden mb-6 shadow-lg">
      <div className="bg-black/60 px-4 py-3 flex justify-between items-center border-b border-white/10">
        <span className="font-mono text-xs text-emerald-400 font-medium">{title}</span>
        <button 
          onClick={copy} 
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="p-4 bg-[#0a0a0a] text-gray-300 font-mono text-sm overflow-x-auto whitespace-pre">
{code.trim()}
      </div>
    </div>
  );
}

type ApiType = 'chat' | 'image' | 'video' | 'openai' | 'deepseek' | 'dalle' | 'midjourney' | 'fluxpro' | 'fluxmax' | 'jimeng-image' | 'jimeng-video' | 'kling-video' | 'sora' | 'docs' | 'billing' | 'settings' | 'error-logs';

const MODEL_INFO: Record<string, { name: string, desc: string, docUrl: string, method: string }> = {
  chat: {
    name: "Gemini Text (问答)",
    desc: "Google 新一代原生多模态大语言模型，处理对话、分析和推理。",
    docUrl: "https://ai.google.dev/docs",
    method: "gemini-3.1-pro-preview"
  },
  image: {
    name: "Gemini Image (生图)",
    desc: "Google 高保真图像生成引擎，支持多种比例和风格参数传入。",
    docUrl: "https://ai.google.dev/docs/image_generation",
    method: "gemini-3.1-flash-image-preview"
  },
  video: {
    name: "Google Veo (生视频)",
    desc: "Google 最先进的高质量视频生成模型，支持长时长大片级运镜。",
    docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos",
    method: "veo-3.1-lite-generate-preview"
  },
  openai: {
    name: "OpenAI GPT (对话)",
    desc: "通过配置的官方 SDK 接入 OpenAI，演示多模型网关桥接能力。",
    docUrl: "https://platform.openai.com/docs/api-reference",
    method: "gpt-4o-mini"
  },
  deepseek: {
    name: "DeepSeek Text (问答)",
    desc: "深度求索开源/闭源模型集，支持深度推理 (deepseek-reasoner) 和通用聊天 (deepseek-chat)。",
    docUrl: "https://platform.deepseek.com/docs",
    method: "deepseek-reasoner"
  },
  dalle: {
    name: "DALL-E / GPT Image (生图)",
    desc: "OpenAI 图像生成模型",
    docUrl: "https://platform.openai.com/docs/guides/images",
    method: "gpt-image-2"
  },
  midjourney: {
    name: "Midjourney (MJ 生图)",
    desc: "Midjourney 高保真图像生成模型",
    docUrl: "https://docs.midjourney.com/",
    method: "midjourney"
  },
  fluxpro: {
    name: "Flux 2 Pro (生图)",
    desc: "Flux 2 Pro 高级图像生成模型",
    docUrl: "https://blackforestlabs.ai/",
    method: "flux-2-pro"
  },
  fluxmax: {
    name: "Flux 2 Max (生图)",
    desc: "Flux 2 Max 旗舰版图像生成模型",
    docUrl: "https://blackforestlabs.ai/",
    method: "flux-2-max"
  },
  'jimeng-image': {
    name: "即梦/豆包 (生图)",
    desc: "火山引擎旗下即梦/豆包 Seedream 旗舰级图像生成模型。",
    docUrl: "https://www.volcengine.com/docs/82989/1218556",
    method: "doubao-seedream-5.0-lite"
  },
  'jimeng-video': {
    name: "即梦 Jimeng (生视频)",
    desc: "即梦 (Dreamina) 视频生成模型 Seedance。",
    docUrl: "https://www.volcengine.com/product/dreamina",
    method: "doubao-seedance-2.0"
  },
  'kling-video': {
    name: "可灵 Kling AI (生视频)",
    desc: "快手旗下旗舰级视频生成大模型，支持超长时长与高度连贯性。",
    docUrl: "https://klingai.com/",
    method: "kling-v3"
  },
  sora: {
    name: "OpenAI Sora (生视频)",
    desc: "OpenAI 文本到视频生成模型，提供超现实的高清运镜和连贯的视频创作体验",
    docUrl: "https://openai.com/sora",
    method: "sora"
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ApiType>('chat');
  
  // Playground state
  const [password, setPassword] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [prompt, setPrompt] = useState('你好，请用中文介绍你是由哪家公司开发的模型？');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K'); // 增加正式的 state 绑定
  const [videoResolution, setVideoResolution] = useState('720p');
  const [videoDuration, setVideoDuration] = useState(5);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const [referenceImageTail, setReferenceImageTail] = useState<string | null>(null);
  const [referenceImageTailName, setReferenceImageTailName] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [billingLogs, setBillingLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<string>('');
  const [adminGeminiKey, setAdminGeminiKey] = useState<string>('');
  const [adminOpenaiKey, setAdminOpenaiKey] = useState<string>('');
  const [adminOpenaiBaseUrl, setAdminOpenaiBaseUrl] = useState<string>('');
  const [adminMidjourneyKey, setAdminMidjourneyKey] = useState<string>('');
  const [adminMidjourneyBaseUrl, setAdminMidjourneyBaseUrl] = useState<string>('');
  const [adminFluxKey, setAdminFluxKey] = useState<string>('');
  const [adminFluxBaseUrl, setAdminFluxBaseUrl] = useState<string>('');
  const [adminJimengKey, setAdminJimengKey] = useState<string>('');
  const [adminJimengBaseUrl, setAdminJimengBaseUrl] = useState<string>('');
  const [adminKlingKey, setAdminKlingKey] = useState<string>('');
  const [adminKlingBaseUrl, setAdminKlingBaseUrl] = useState<string>('');
  const [adminDeepseekKey, setAdminDeepseekKey] = useState("");
  const [adminDeepseekBaseUrl, setAdminDeepseekBaseUrl] = useState("");
  const [adminMjMode, setAdminMjMode] = useState<'openai' | 'task'>('openai');
  const [configSaved, setConfigSaved] = useState<boolean>(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState<boolean>(false);
  const [settingsUnlockError, setSettingsUnlockError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (activeTab === 'billing' || activeTab === 'error-logs' as any) {
      fetchBilling(); // Fetch immediately on tab switch
      intervalId = setInterval(() => {
        fetchBilling();
      }, 3000); // Poll every 3 seconds for fast real-time feedback
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    setReferenceImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    setReferenceImageTailName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImageTail(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-ai-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab
      window.open(url, '_blank text-decoration-none');
    }
  };

  // Switch tabs and reset prompts contextually
  const changeTab = (tab: ApiType) => {
    setActiveTab(tab);
    setResult(null);
    setError(null);

    if (tab === 'billing' || tab === 'error-logs' as any) {
      fetchBilling();
      return;
    }

    if (tab === 'settings') {
      setSettingsUnlockError(null);
      fetchConfig();
      return;
    }

    if (tab === 'chat') {
      setPrompt('你好，请用中文介绍你是由哪家公司开发的模型？');
      setSelectedModel('gemini-3.1-pro-preview');
    }
    if (tab === 'image') {
      setPrompt('赛博朋克风格的未来城市，一只红腹锦鸡站在屋顶上，最新数字单反拍摄，8k，写实。');
      setSelectedModel('gemini-3.1-flash-image-preview'); // Defaults back to best model
    }
    if (tab === 'video') {
      setPrompt('Cinematic shot of a bright red panda taking a sip of hot tea on a snowy mountain.');
      setSelectedModel('veo-3.1-lite-generate-preview');
    }
    if (tab === 'openai') {
      setPrompt('你好，你是 OpenAI 还是 Google？');
      setSelectedModel('gpt-4o-mini');
    }
    if (tab === 'deepseek') {
      setPrompt('9.11 and 9.8 which is greater? Please solve it step by step.');
      setSelectedModel('deepseek-reasoner');
    }
    if (tab === 'dalle') {
      setPrompt('一只可爱的柴犬穿着宇航服在火星表面漫步，高清晰度，电影级光影');
      setSelectedModel('gpt-image-2');
    }
    if (tab === 'midjourney') {
      setPrompt('A futuristic city rendered in Unreal Engine 5, neon lights, highly detailed --ar 16:9');
      setSelectedModel('midjourney');
    }
    if (tab === 'fluxpro') {
      setPrompt('A beautiful cybernetic woman portrait, highly detailed realism, 8k resolution');
      setSelectedModel('flux-2-pro');
    }
    if (tab === 'fluxmax') {
      setPrompt('Hyper-realistic majestic dragon soaring through a thunderstorm, dramatic lighting');
      setSelectedModel('flux-2-max');
    }
    if (tab === 'jimeng-image') {
      setPrompt('充满活力的特写编辑肖像，模特眼神犀利，头戴雕塑感帽子，色彩拼接丰富，眼部焦点锐利，景深较浅。');
      setSelectedModel('doubao-seedream-5.0-lite');
    }
    if (tab === 'jimeng-video') {
      setPrompt('电影级镜头，壮阔的云海翻腾，夕阳照耀在雪山之巅，4k，极其震撼。');
      setSelectedModel('doubao-seedance-2.0');
    }
    if (tab === 'kling-video') {
      setPrompt('一个人在雨中漫步的特写镜头，雨滴打在雨伞上，高度写实，连贯动作。');
      setSelectedModel('kling-v3');
    }
    if (tab === 'sora') {
      setPrompt('Cinematic shot of a bright red panda taking a sip of hot tea on a snowy mountain.');
      setSelectedModel('sora');
    }
  }

  const fetchBilling = async () => {
    try {
      const response = await fetch('/api/billing');
      const data = await response.json();
      if (data.success) {
        setBillingLogs(data.logs);
      }
      const errRes = await fetch('/api/dispatch-logs');
      const errData = await errRes.json();
      if (errData.success) {
        setErrorLogs(errData.logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async (pwd?: string) => {
    const passToUse = pwd !== undefined ? pwd : (activeTab === 'settings' ? settingsPassword : password);
    if (!passToUse && activeTab === 'settings') {
      setIsSettingsUnlocked(false);
      return false;
    }
    try {
      const response = await fetch('/api/admin/config', {
        headers: { "Authorization": `Bearer ${passToUse}` }
      });
      const data = await response.json();
      if (data.success) {
        setIpWhitelist(data.whitelist);
        setAdminGeminiKey(data.geminiKey);
        setAdminOpenaiKey(data.openaiKey);
        setAdminOpenaiBaseUrl(data.openaiBaseUrl);
        setAdminMidjourneyKey(data.midjourneyKey || "");
        setAdminMidjourneyBaseUrl(data.midjourneyBaseUrl || "");
        setAdminFluxKey(data.fluxKey || "");
        setAdminFluxBaseUrl(data.fluxBaseUrl || "");
        setAdminMjMode(data.mjMode || 'openai');
        setIsSettingsUnlocked(true);
        setSettingsUnlockError(null);
        return true;
      } else {
        if (activeTab === 'settings') {
          setSettingsUnlockError(data.error || "口令不正确");
          setIsSettingsUnlocked(false);
        } else {
          setError(data.error || "获取配置失败，密钥可能不正确");
        }
        return false;
      }
    } catch (e) {
      if (activeTab === 'settings') {
        setSettingsUnlockError("网络错误或口令不正确");
        setIsSettingsUnlocked(false);
      } else {
        setError("无权限，请先在下方输入“网关私有锁”鉴权口令。");
      }
      return false;
    }
  };

  const handleSettingsUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsUnlockError(null);
    await fetchConfig(settingsPassword);
  };

  const saveConfig = async () => {
    if (!settingsPassword) {
      setError("请输入“网关私有锁”口令后再保存配置。");
      return;
    }
    setError(null);
    setConfigSaved(false);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${settingsPassword}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          whitelist: ipWhitelist,
          geminiKey: adminGeminiKey,
          openaiKey: adminOpenaiKey,
          openaiBaseUrl: adminOpenaiBaseUrl,
          midjourneyKey: adminMidjourneyKey,
          midjourneyBaseUrl: adminMidjourneyBaseUrl,
          fluxKey: adminFluxKey,
          fluxBaseUrl: adminFluxBaseUrl,
          jimengKey: adminJimengKey,
          jimengBaseUrl: adminJimengBaseUrl,
          klingKey: adminKlingKey,
          klingBaseUrl: adminKlingBaseUrl,
          deepseekKey: adminDeepseekKey,
          deepseekBaseUrl: adminDeepseekBaseUrl,
          mjMode: adminMjMode
        })
      });
      const data = await response.json();
      if (data.success) {
        setIpWhitelist(data.whitelist);
        setAdminGeminiKey(data.geminiKey);
        setAdminOpenaiKey(data.openaiKey);
        setAdminOpenaiBaseUrl(data.openaiBaseUrl);
        setAdminMidjourneyKey(data.midjourneyKey || "");
        setAdminMidjourneyBaseUrl(data.midjourneyBaseUrl || "");
        setAdminFluxKey(data.fluxKey || "");
        setAdminFluxBaseUrl(data.fluxBaseUrl || "");
        setAdminJimengKey(data.jimengKey || "");
        setAdminJimengBaseUrl(data.jimengBaseUrl || "");
        setAdminKlingKey(data.klingKey || "");
        setAdminKlingBaseUrl(data.klingBaseUrl || "");
        setAdminDeepseekKey(data.deepseekKey || "");
        setAdminDeepseekBaseUrl(data.deepseekBaseUrl || "");
        setAdminMjMode(data.mjMode || 'openai');
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      } else {
        setError(data.error || "保存失败");
      }
    } catch (e) {
      setError("网络或权限错误，保存失败。");
    }
  };

  const handleTest = async () => {
    if (!password) {
      setError("请先输入您的私有网关鉴权口令 (同 Secrets 里的 PROXY_SECRET_KEY / liangshan 值)");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = { prompt };
      
      // Inject dynamically selected model
      payload.model = selectedModel;
      
      if (['image', 'dalle', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image', 'jimeng-video', 'kling-video', 'sora', 'video'].includes(activeTab)) {
        payload.aspectRatio = aspectRatio;
        if (referenceImage) {
          payload.referenceImage = referenceImage;
        }
        if (referenceImageTail) {
          payload.referenceImageTail = referenceImageTail;
        }
        
        // ------------- 动态比例计算层 -------------
        let baseArea = 1024 * 1024;
        let multiplier = 1;
        if (imageSize === '2K') multiplier = 2;
        if (imageSize === '4K') multiplier = 3.6;
        if (imageSize === '256' || imageSize === '256x256') multiplier = 0.25;
        if (imageSize === '512' || imageSize === '512x512') multiplier = 0.5;

        let widthRatio = 1, heightRatio = 1;
        if (aspectRatio && aspectRatio.includes(':')) {
           const parts = aspectRatio.split(':');
           widthRatio = parseFloat(parts[0]) || 1;
           heightRatio = parseFloat(parts[1]) || 1;
        }

        let height = Math.sqrt(baseArea * heightRatio / widthRatio);
        let width = height * (widthRatio / heightRatio);

        height = height * multiplier;
        width = width * multiplier;

        height = Math.round(height / 32) * 32;
        width = Math.round(width / 32) * 32;

        if (width === 4960) width = 4928; // Special Edge Case for exactly 4928

        payload.imageSize = imageSize; // '1K', '2K', '4K'
        payload.size = `${width}x${height}`;
      }
      
      if (['video', 'jimeng-video', 'kling-video', 'sora'].includes(activeTab)) {
        payload.videoResolution = videoResolution;
        payload.duration = videoDuration;
      }
      
      payload.actionType = activeTab;

      let endpoint = `/api/${activeTab}`;
      if (['deepseek'].includes(activeTab)) {
        endpoint = '/api/openai';
      } else if (['dalle', 'midjourney', 'fluxpro', 'fluxmax', 'sora', 'jimeng-image', 'jimeng-video', 'kling-video'].includes(activeTab)) {
        endpoint = '/api/v1/generate';
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${password}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error && typeof data.error === 'object' && data.error.message) {
          throw new Error(`上游模型官方报错: ${data.error.message}`);
        }
        throw new Error(data.error || data.detail || JSON.stringify(data) || "请求失败");
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || "请求异常，请检查网络或控制台");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-emerald-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <h1 className="text-xl font-bold tracking-tight text-white">Universal AI Gateway <span className="text-emerald-400 font-mono text-xs ml-2 border border-emerald-500/30 px-2 py-0.5 rounded-full">v2.0</span></h1>
          </div>
          <div className="flex bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 items-center">
            <Server className="w-3.5 h-3.5 mr-2" />
            已接入多模型海外超级节点
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto overflow-hidden">
        
        {/* Left Sidebar Layout */}
        <aside className="w-64 border-r border-white/10 flex flex-col pt-6 pr-6 py-8">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">文本互动</div>
          <div className="space-y-1 mb-8">
            <button
              onClick={() => changeTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'chat' ? 'bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <MessageSquare className="w-4 h-4" /> Gemini 文本
            </button>
            <button
              onClick={() => changeTab('openai')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'openai' ? 'bg-blue-500/15 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <Bot className="w-4 h-4" /> OpenAI GPT
            </button>
            <button
              onClick={() => changeTab('deepseek')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'deepseek' ? 'bg-blue-500/15 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <Bot className="w-4 h-4" /> DeepSeek
            </button>
          </div>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">图像创作</div>
          <div className="space-y-1 mb-8">
            <button
              onClick={() => changeTab('image')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'image' ? 'bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <ImageIcon className="w-4 h-4" /> Gemini 生图
            </button>
            <button
              onClick={() => changeTab('dalle')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'dalle' ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <ImageIcon className="w-4 h-4" /> DALL-E / GPT Image
            </button>
            <button
              onClick={() => changeTab('midjourney')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'midjourney' ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <ImageIcon className="w-4 h-4" /> Midjourney 生图
            </button>
            <button
              onClick={() => changeTab('fluxpro')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'fluxpro' ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <ImageIcon className="w-4 h-4" /> Flux 2 Pro
            </button>
            <button
               onClick={() => changeTab('fluxmax')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'fluxmax' ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <ImageIcon className="w-4 h-4" /> Flux 2 Max
             </button>
             <button
               onClick={() => changeTab('jimeng-image')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'jimeng-image' ? 'bg-rose-500/15 text-rose-400 font-medium border border-rose-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <ImageIcon className="w-4 h-4" /> 字节火山引擎 (生图)
             </button>
           </div>

           <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">视频创作</div>
           <div className="space-y-1 mb-8">
             <button
               onClick={() => changeTab('video')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'video' ? 'bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <Video className="w-4 h-4" /> Veo 生视频
             </button>
             <button
               onClick={() => changeTab('jimeng-video')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'jimeng-video' ? 'bg-rose-500/15 text-rose-400 font-medium border border-rose-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <Video className="w-4 h-4" /> 即梦 (生视频)
             </button>
             <button
               onClick={() => changeTab('kling-video')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'kling-video' ? 'bg-orange-500/15 text-orange-400 font-medium border border-orange-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <Video className="w-4 h-4" /> 可灵 Kling (生视频)
             </button>
             <button
               onClick={() => changeTab('sora')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'sora' ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
             >
               <Video className="w-4 h-4" /> Sora 生视频
             </button>
           </div>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-auto border-t border-white/5 pt-6">开发对接体系</div>
          <div className="space-y-1 mb-6">
            <button
              onClick={() => changeTab('docs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'docs' ? 'bg-purple-500/15 text-purple-400 font-medium border border-purple-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <FileCode className="w-4 h-4" /> 架构与分发手册
            </button>
            <button
              onClick={() => changeTab('billing' as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'billing' as any ? 'bg-yellow-500/15 text-yellow-400 font-medium border border-yellow-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <Coffee className="w-4 h-4" /> 测试账单监控
            </button>
            <button
              onClick={() => changeTab('error-logs' as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'error-logs' as any ? 'bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <AlertTriangle className="w-4 h-4" /> 调度监控日志
            </button>
            <button
              onClick={() => changeTab('settings' as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeTab === 'settings' as any ? 'bg-rose-500/15 text-rose-400 font-medium border border-rose-500/20' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <Shield className="w-4 h-4" /> 控制面板 (Settings)
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-6 pl-8 overflow-y-auto">
          {['chat', 'image', 'video', 'openai', 'deepseek', 'dalle', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image', 'jimeng-video', 'kling-video', 'sora'].includes(activeTab) ? (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              
              {/* Header card for the selected model */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 flex justify-between items-start shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {MODEL_INFO[activeTab].name}
                  </h2>
                  <p className="text-sm text-gray-400">{MODEL_INFO[activeTab].desc}</p>
                </div>
                <a 
                  href={MODEL_INFO[activeTab].docUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-black hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all shadow-sm group"
                >
                  前往 <span className="group-hover:text-white font-medium">{MODEL_INFO[activeTab].name.split(" ")[0]}</span> 官方文档 <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-10">
                {/* Left Column - Controls */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl relative top-0">
                    <h3 className="text-[10px] font-bold text-white/40 mb-4 uppercase tracking-widest">网关路由入参配置</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">本站网关私有锁 (PROXY_SECRET_KEY) <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          style={{ WebkitTextSecurity: 'disc' }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="例如：liangshan"
                          name="gateway_secret_key_prevent_autofill"
                          autoComplete="new-password"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute('readonly')}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-400 mb-2">选择底层引擎 (Model Version)</label>
                          {activeTab === 'chat' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('gemini-3.1-pro-preview')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gemini-3.1-pro-preview' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                gemini-3.1-pro-preview (推荐:全能推理版)
                              </button>
                            </div>
                          )}
                          {activeTab === 'image' && (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => setSelectedModel('gemini-3.1-flash-image-preview')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gemini-3.1-flash-image-preview' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                gemini-3.1-flash-image-preview
                              </button>
                              <button onClick={() => setSelectedModel('gemini-3-pro-image-preview')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                gemini-3-pro-image-preview (高级版)
                              </button>
                              <button onClick={() => setSelectedModel('imagen-3.0-fast-generate-preview')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'imagen-3.0-fast-generate-preview' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                imagen-3.0-fast-generate-preview
                              </button>
                            </div>
                          )}
                          {activeTab === 'dalle' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('dall-e-3')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'dall-e-3' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                DALL-E 3 (高质量)
                              </button>
                              <button onClick={() => setSelectedModel('gpt-image-2')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gpt-image-2' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                GPT-Image 2 / DALL-E 2
                              </button>
                            </div>
                          )}
                          {activeTab === 'midjourney' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('midjourney')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'midjourney' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Midjourney (MJ)
                              </button>
                            </div>
                          )}
                          {activeTab === 'fluxpro' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('flux-2-pro')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'flux-2-pro' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Flux 2 Pro
                              </button>
                            </div>
                          )}
                           {activeTab === 'fluxmax' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('flux-2-max')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'flux-2-max' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Flux 2 Max
                              </button>
                            </div>
                          )}
                          {activeTab === 'jimeng-image' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('doubao-seedream-5.0-lite')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'doubao-seedream-5.0-lite' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Seedream 5.0 Lite
                              </button>
                              <button onClick={() => setSelectedModel('doubao-seedream-4.5')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'doubao-seedream-4.5' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Seedream 4.5
                              </button>
                            </div>
                          )}
                          {activeTab === 'jimeng-video' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('doubao-seedance-2.0')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'doubao-seedance-2.0' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Seedance 2.0
                              </button>
                              <button onClick={() => setSelectedModel('doubao-seedance-2.0-fast')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'doubao-seedance-2.0-fast' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                Seedance 2.0 Fast
                              </button>
                            </div>
                          )}
                          {activeTab === 'kling-video' && (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => setSelectedModel('kling-video-o1')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'kling-video-o1' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                可灵 O1
                              </button>
                              <button onClick={() => setSelectedModel('kling-v3-omni')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'kling-v3-omni' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                可灵 v3 Omni
                              </button>
                              <button onClick={() => setSelectedModel('kling-v3')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'kling-v3' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}>
                                可灵 v3
                              </button>
                            </div>
                          )}
                          {activeTab === 'sora' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('sora')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'sora' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                Sora (默认)
                              </button>
                            </div>
                          )}
                          {activeTab === 'video' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('veo-3.1-lite-generate-preview')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'veo-3.1-lite-generate-preview' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                veo-3.1-lite-generate-preview (默认)
                              </button>
                            </div>
                          )}
                          {activeTab === 'openai' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('gpt-4o-mini')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gpt-4o-mini' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                gpt-4o-mini
                              </button>
                              <button onClick={() => setSelectedModel('gpt-4o')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'gpt-4o' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                gpt-4o (旗舰版)
                              </button>
                              <button onClick={() => setSelectedModel('o3-mini')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'o3-mini' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                o3-mini (推理)
                              </button>
                            </div>
                          )}
                          {activeTab === 'deepseek' && (
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedModel('deepseek-chat')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'deepseek-chat' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                deepseek-chat
                              </button>
                              <button onClick={() => setSelectedModel('deepseek-reasoner')} className={`px-4 py-2 text-xs rounded border transition-colors ${selectedModel === 'deepseek-reasoner' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                deepseek-reasoner (深度推理)
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-400 mb-1">自定义模型名称 (如果上述没有，可手动输入 Endpoint 或模型 ID)</label>
                          <input 
                            type="text"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                            placeholder="例如：ep-202410... 或 doubao-video..."
                          />
                        </div>

                        <label className="block text-xs font-medium text-gray-400 mb-1">功能测试提示词 (Prompt)</label>
                        <textarea 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={6}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none mb-3"
                        />

                        {['image', 'dalle', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image', 'kling-video'].includes(activeTab) && (
                          <div className="mb-4 space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">首图/参考图上传 (Reference Image - 可选)</label>
                              <div className="relative group">
                                {!referenceImage ? (
                                  <div className="border-2 border-dashed border-white/10 rounded-xl p-4 transition-all hover:bg-white/5 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden">
                                    <Upload className="w-6 h-6 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-300">点击或通过拖拽上传 Base64 格式参考图（首图）</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={handleFileChange}
                                      className="absolute inset-0 opacity-0 cursor-pointer" 
                                    />
                                  </div>
                                ) : (
                                  <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <img src={referenceImage} className="w-12 h-12 rounded object-cover border border-white/10" alt="Preview" />
                                      <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-emerald-400 truncate">{referenceImageName}</p>
                                        <p className="text-[8px] text-gray-500">已成功编码为 Base64。请求时将自动注入 payload。</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => { setReferenceImage(null); setReferenceImageName(null); }}
                                      className="p-2 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {activeTab === 'kling-video' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">尾图上传 (Reference Image Tail - 可选)</label>
                                <div className="relative group">
                                  {!referenceImageTail ? (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 transition-all hover:bg-white/5 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden">
                                      <Upload className="w-6 h-6 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                                      <span className="text-[10px] text-gray-500 group-hover:text-gray-300">点击或通过拖拽上传 Base64 格式参考图（尾图）</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleTailFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                      />
                                    </div>
                                  ) : (
                                    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={referenceImageTail} className="w-12 h-12 rounded object-cover border border-white/10" alt="Preview" />
                                        <div className="overflow-hidden">
                                          <p className="text-[10px] font-bold text-emerald-400 truncate">{referenceImageTailName}</p>
                                          <p className="text-[8px] text-gray-500">已成功编码为 Base64。请求时将自动注入 payload。</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => { setReferenceImageTail(null); setReferenceImageTailName(null); }}
                                        className="p-2 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {['image', 'dalle', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image', 'jimeng-video', 'kling-video', 'sora', 'video'].includes(activeTab) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            
                            {/* Aspect Ratio - Common for most image/video models */}
                            {['image', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image', 'jimeng-video', 'kling-video', 'sora', 'video'].includes(activeTab) && (
                              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                                <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">图片/视频比例 (Aspect Ratio)</label>
                                <div className="flex flex-wrap gap-2">
                                  {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() => setAspectRatio(ratio)}
                                      className={`px-3 py-1.5 flex-grow text-xs rounded border transition-colors cursor-pointer ${aspectRatio === ratio ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}
                                    >
                                      {ratio}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Resolution - Specific for Jimeng/Flux/Dalle/Gemini */}
                            {['image', 'dalle', 'fluxpro', 'fluxmax', 'jimeng-image'].includes(activeTab) && (
                              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                                <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">输出分辨率 (Resolution)</label>
                                <div className="flex flex-wrap gap-2">
                                  {activeTab === 'dalle' ? (
                                     ['1024x1024', '1024x1792', '1792x1024'].map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setImageSize(size)}
                                        className={`flex-1 py-1.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${imageSize === size ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}
                                      >
                                        {size}
                                      </button>
                                    ))
                                  ) : (
                                    ['1K', '2K', '4K'].map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setImageSize(size)}
                                        className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${imageSize === size ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}
                                      >
                                        {size}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Video Resolution and Duration */}
                            {['jimeng-video', 'kling-video'].includes(activeTab) && (
                              <>
                                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                                  <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">输出分辨率 (Video Resolution)</label>
                                  <div className="flex flex-wrap gap-2">
                                    {['480p', '720p', '1080p'].map((res) => {
                                      // seedance 2.0 fast does not support 1080p
                                      const isFast = selectedModel.includes('fast');
                                      const disabled = isFast && res === '1080p';
                                      const displayLabel = activeTab === 'kling-video' ? (res === '1080p' ? '1080p (Pro)' : (res === '720p' ? '720p (Std)' : res)) : res;
                                      return (
                                        <button
                                          key={res}
                                          onClick={() => !disabled && setVideoResolution(res)}
                                          disabled={disabled}
                                          className={`flex-1 py-1.5 text-[10px] font-mono rounded border transition-colors ${disabled ? 'opacity-30 cursor-not-allowed bg-black/40 border-white/5 text-gray-600' : videoResolution === res ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 cursor-pointer' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30 cursor-pointer'}`}
                                        >
                                          {displayLabel}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="bg-black/30 border border-white/5 rounded-lg p-3 md:col-span-2">
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">生成时长 (Video Duration)</label>
                                    <span className="text-xs text-indigo-400 font-mono">{videoDuration === -1 ? 'Auto' : `${videoDuration}s`}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    {activeTab === 'kling-video' ? [5, 10].map((duration) => (
                                      <button
                                        key={duration}
                                        onClick={() => setVideoDuration(duration)}
                                        className={`flex-1 py-1.5 text-xs rounded border transition-colors cursor-pointer ${videoDuration === duration ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}
                                      >
                                        {duration} 秒
                                      </button>
                                    )) : [4, 5, 10, 15, -1].map((duration) => (
                                      <button
                                        key={duration}
                                        onClick={() => setVideoDuration(duration)}
                                        className={`flex-1 py-1.5 text-xs rounded border transition-colors cursor-pointer ${videoDuration === duration ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'}`}
                                      >
                                        {duration === -1 ? '智能选择' : `${duration} 秒`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <button 
                          onClick={handleTest}
                          disabled={loading}
                          className={`w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${loading ? 'bg-emerald-500/50 cursor-not-allowed text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'}`}
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                          {loading ? '等待底层通道响应...' : '发射请求 (Send)'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Output */}
                <div className="lg:col-span-12 xl:col-span-7">
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl h-full min-h-[500px] flex flex-col overflow-hidden shadow-2xl relative">
                    <div className="bg-black/80 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest font-bold text-gray-500">Node.js 服务端返回实时流</span>
                      {loading && <span className="text-[10px] uppercase font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-1 rounded">Tunnel Active</span>}
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto w-full">
                      {!loading && !result && !error && (
                        <div className="text-center text-gray-600 flex flex-col items-center">
                          <Terminal className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm">尚未发起请求。<br/>此处将原生渲染从 {MODEL_INFO[activeTab].name.split(" ")[0]} 剥离外壳后的结构化数据。</p>
                        </div>
                      )}

                      {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-sm text-red-400 mt-0 my-auto">
                          <h4 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> 哎呀，请求受阻</h4>
                          <p className="font-mono text-xs opacity-90 mt-1 mb-2">{error}</p>
                          {(error.includes('fetch failed') || error.includes('does not exist') || error.includes('access')) && (
                            <div className="mt-3 text-xs bg-red-500/20 p-3 rounded-lg text-red-200">
                              <strong>问题排查建议 (Troubleshooting):</strong>
                              <ul className="list-disc pl-4 mt-2 mb-1 space-y-1">
                                {error.includes('fetch failed') && <li>提示 fetch failed 表示无法连接到代理服务或API网关，请前往「设置(Settings)」检查 Base URL 域名和协议(http/https)是否填写正确。例如官方API为 https://api.klingai.com/v1</li>}
                                {(error.includes('does not exist') || error.includes('access')) && <li>对于【火山引擎即梦】模型：报错表示必须使用您在控制台申请的 Endpoint ID 作为模型名称重试。请在左侧「自定义模型名称」输入框填入您的 <code>ep-xxxx</code> ID。<br/>对于【中转API网关/代理】：这通常意味着您的第三方 API 服务商未收录该模型别名或不支持该官方调度链路。</li>}
                                {(error.includes('is not supported') || error.includes('Invalid model')) && <li>该报错表示服务器不识别该模型名称或不支持该接口链路。如有必要请使用代理网关提供的自定义模型名重试。</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {result && !error && (
                        <div className="w-full h-full flex flex-col space-y-6">
                          {(activeTab === 'chat' || activeTab === 'openai') && (
                            <div className="bg-white/5 rounded-xl p-5 border border-emerald-500/20 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] w-full block">
                              {result.text}
                            </div>
                          )}

                          {['image', 'dalle', 'midjourney', 'fluxpro', 'fluxmax', 'jimeng-image'].includes(activeTab) && result.imageUrl && (
                            <div className="w-full flex flex-col items-center">
                              <div className="relative group">
                                <div className="flex justify-center bg-black/40 rounded-xl p-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] w-full">
                                  <img src={result.imageUrl} alt="Generated AI" className="max-w-full h-auto rounded-lg shadow-lg object-contain max-h-[500px]" />
                                </div>
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleDownload(result.imageUrl)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black p-3 rounded-full shadow-xl shadow-black/50 transition-all flex items-center justify-center"
                                    title="下载高清原图"
                                  >
                                    <Download className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-center">
                                <button 
                                  onClick={() => handleDownload(result.imageUrl)}
                                  className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-emerald-400 transition-all cursor-pointer"
                                >
                                  <Download className="w-4 h-4" /> 点击此处下载保存 (Download Result)
                                </button>
                              </div>
                            </div>
                          )}

                          {['sora', 'video', 'jimeng-video', 'kling-video'].includes(activeTab) && (result.videoUrl || result.videoUri) && (
                            <div className="flex justify-center bg-black/40 rounded-xl p-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)] w-full">
                              <video src={result.videoUrl || result.videoUri} controls autoPlay loop className="max-w-full h-auto rounded-lg shadow-lg object-contain max-h-[500px]" />
                            </div>
                          )}

                          {/* Raw JSON viewer */}
                          <div className="mt-auto pt-6 border-t border-white/5 w-full block">
                            <div className="flex justify-between items-end mb-2">
                              <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider">
                                JSON 包体 (阿里云目标解析源)
                              </p>
                              <div className="flex items-center gap-3">
                                {result.estimatedCostUsd !== undefined && (
                                  <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded text-[10px] font-mono shadow-sm">
                                    此单成本估算: ${result.estimatedCostUsd.toFixed(6)}
                                  </span>
                                )}
                                <span className="opacity-50 text-[10px] font-bold tracking-wider">STATUS: 200 OK</span>
                              </div>
                            </div>
                            <pre className="bg-black/60 p-4 rounded-xl font-mono text-[10px] sm:text-xs text-gray-400 overflow-x-auto border border-white/5 w-full block">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'docs' ? (
            /* Docs Tab View */
            <div className="animate-in fade-in duration-300 pb-10">
              <div className="max-w-4xl space-y-8 pr-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-3">架构说明与分发指南</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    本网关完全遵循微服务标准设计。它唯一的作用就是作为一个<strong>隐形的超级中转站</strong>。当你在前端/阿里云构建业务时，遇到国内不通的 AI 厂商（Google, OpenAI 等），你无需折腾复杂的梯子，只需把原来要发向官方域名的 JSON 砍下头，把网关口令注入，改发到本节点地址即可。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col shadow-sm">
                    <Check className="w-8 h-8 text-emerald-400 mb-4" />
                    <p className="font-bold text-lg mb-2 text-white">第 1 步：生成对外通信渠道</p>
                    <p className="text-sm text-emerald-200/80">务必点击当前开发平台右上角的 <strong>Share</strong> (或 Publish)。这会得到一个公网链接以 <code className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded text-xs mx-1">ais-pre-</code> 打头。这就代表你的跨海专线成功开通。</p>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 flex flex-col shadow-sm">
                    <Server className="w-8 h-8 text-purple-400 mb-4" />
                    <p className="font-bold text-lg mb-2 text-white">第 2 步：自用/VPS 独立部署</p>
                    <p className="text-sm text-purple-200/80">脱离测试环境的最终形态：点击 Export 导出 ZIP 源文件。扔到自己的海外云主机（Vercel, Render）运行 <code className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded text-xs mx-1">npm install</code> 和 <code className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded text-xs mx-1">npm run build</code> 即可。</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-emerald-400 mb-4 border-b border-emerald-500/20 pb-2">新特性：多大模型全自动分发路由 (Omni-Router)</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    您提出了<strong>“平台只需一个密钥、一个目标地址，传入所需调度的大模型名称和参数，网关自动分析和请求相应模型”</strong>的构想。
                    此功能现已在底层的 <strong>Omni-Router</strong> 中实现！您现在的国内 AI 平台代码仅需向网关的一个超级接口发送数据，网关内部的 AI 将自行剖析参数类型并切分路由。
                  </p>

                  <CodeBlock title="Node.js / 客户端 / PHP 通用 -> /api/v1/generate 统分发口" code={`
// 发送到超级网关地址：
const OMNI_URL = "替换为网关外部链接/api/v1/generate";

// 包体格式完全统一 (One Payload rules them all):
const payload = {
    // 决定生图还是回答的核心：网关靠识别你的模型名字自动推演路由！
    // 传 'gpt-4o' / 'dall-e-3' / 'gemini-3.1-pro' / 'imagen-3' 都会被智能分发
    "model": "dall-e-3", 

    "prompt": "画一个赛博朋克风格的咖啡杯", // 或聊天提示词
    
    // 【如果推演判定该模型是生图模型，它会自动读取并兼容以下增强参数】
    "aspectRatio": "16:9",      
    "imageSize": "4K",          
    "referenceImage": "data:image/jpeg;base64,...", // 兼顾图生图
    "numberOfImages": 1,
    
    // 【如果推演判定该模型是问答大语言模型，它会自动读取以下高级架构】
    "temperature": 0.5,
    "systemInstruction": "你是一个画图助手..."
};

// 依然靠唯一密钥通行
const headers = {
    "Authorization": "Bearer 你的网关密钥",
    "Content-Type": "application/json"
};
                  `} />
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">传统分口调用原生代码案例 (针对精确微服务链路)</h3>
                  
                  <CodeBlock title="PHP -> 携带高级参数 (生成/分析) 示例" code={`
<?php
$url = "替换为上面第1步获取到的 ais-pre-XXXX 开头的公网链接/api/image"; // 或 /api/chat 等
$password = "替换成你在网关设的 PROXY_SECRET_KEY"; 

$data = array(
    "model" => "gemini-3.1-flash-image-preview",
    "prompt" => "今天天气怎么样？画一张风景图",
    
    // 【图片生成专属参数】
    "aspectRatio" => "16:9",      // 1:1, 16:9, 4:3 等
    "imageSize" => "1K",          // 1K 等
    "numberOfImages" => 1,        // 生成张数
    "referenceImage" => "data:image/jpeg;base64,.....", // 可选：图生图的垫图(base64)
    
    // 【视频生成专属参数 (发给 /api/video)】
    // "resolution" => "1080p", 
    // "aspectRatio" => "16:9",

    // 【文本/对话高级参数 (发给 /api/chat 或 /api/openai)】
    // "temperature" => 0.7,
    // "systemInstruction" => "你是一个暴躁的程序员..",
    // "images" => ["data:image/jpeg;base64,....", "data:image/png;base64,..."] // 视觉多模态大模型分析图组
);

$options = array(
    "http" => array(
        "header"  => "Content-Type: application/json\\r\\nAuthorization: Bearer " . $password . "\\r\\n",
        "method"  => "POST",
        "content" => json_encode($data),
        "timeout" => 60 
    )
);

$result = file_get_contents($url, false, stream_context_create($options));
echo $result;
?>
                  `} />
                </div>
              </div>
            </div>
          ) : activeTab === 'billing' as any ? (
            /* Billing / Log View */
            <div className="animate-in fade-in duration-300 pb-10 pr-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Coffee className="w-8 h-8 text-yellow-500" />
                    网关消费流水 (Billing Logs)
                  </h2>
                  <p className="text-gray-400 text-sm">记录了您发出的全量请求。此处为依据大厂公开计费单推算的预估消耗。</p>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-6 py-4 text-right shadow-lg">
                  <div className="text-yellow-500/80 text-xs font-bold uppercase mb-1">当前实例平台总账单 (Total Cost)</div>
                  <div className="text-2xl font-mono font-bold text-yellow-400">
                    ${Math.max(0, billingLogs.reduce((sum, log) => sum + (log.estimatedCostUsd || 0), 0)).toFixed(6)}
                  </div>
                </div>
              </div>

              {/* 模型使用量统计 */}
              {billingLogs.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">各模型消耗汇总 (Model Usage Summary)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries<{ count: number; cost: number }>(
                      billingLogs.reduce((acc, log) => {
                        if (!acc[log.model]) acc[log.model] = { count: 0, cost: 0 };
                        acc[log.model].count += 1;
                        acc[log.model].cost += (log.estimatedCostUsd || 0);
                        return acc;
                      }, {} as Record<string, { count: number; cost: number }>)
                    ).sort((a, b) => b[1].cost - a[1].cost).map(([model, stats]) => (
                      <div key={model} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <div className="text-xs font-mono text-gray-400 mb-2 truncate" title={model}>{model}</div>
                        <div className="flex justify-between items-end">
                          <div className="text-sm font-bold text-emerald-400">{stats.count} 次</div>
                          <div className="text-sm font-mono text-yellow-400">${stats.cost.toFixed(6)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">请求者 IP</th>
                        <th className="px-6 py-4">调用时间 (Time)</th>
                        <th className="px-6 py-4">模型通道 (Model)</th>
                        <th className="px-6 py-4">请求内容摘要 (Prompt)</th>
                        <th className="px-6 py-4">规格消耗 (Tokens / Specs)</th>
                        <th className="px-6 py-4 text-right">单笔耗时定价 (Cost)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5">
                      {billingLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-mono text-xs">
                            暂无请求记录。(No requests logged yet)
                          </td>
                        </tr>
                      ) : (
                        billingLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">
                              {log.ip}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs">
                                {log.model}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={log.prompt}>
                              {log.prompt || '<多模态数据>'}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                              {log.apiType === 'chat' && <span>In: {log.usage?.inputTokens} / Out: {log.usage?.outputTokens}</span>}
                              {log.apiType === 'image' && <span>Img: {log.usage?.imageCount}x ({log.usage?.resolution})</span>}
                              {log.apiType === 'video' && <span>Video: {log.usage?.resolution}</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-yellow-400">
                              ${log.estimatedCostUsd?.toFixed(6)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'error-logs' as any ? (
            /* Error Logs View */
            <div className="animate-in fade-in duration-300 pb-10 pr-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-indigo-500" />
                    调度排查与监控 (Dispatch Logs)
                  </h2>
                  <p className="text-gray-400 text-sm">记录了调用各大厂 API 及下游平台的成功和失败记录，包含官方提示词和系统参数等。</p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-6 py-4 text-right shadow-lg">
                  <div className="text-indigo-500/80 text-xs font-bold uppercase mb-1">日志总计 (Total Logs)</div>
                  <div className="text-2xl font-mono font-bold text-indigo-400">
                    {errorLogs.length} 条
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                        <th className="p-4 font-medium">状态 / IP / 时间</th>
                        <th className="p-4 font-medium">触发节点 (Endpoint)</th>
                        <th className="p-4 font-medium">请求模型 (Model)</th>
                        <th className="p-4 font-medium">记录信息摘要 (Details)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {errorLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                            <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            暂无任何调度记录，等待请求...
                          </td>
                        </tr>
                      ) : (
                        errorLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 align-top">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold mb-1.5 ${log.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {log.success ? 'SUCCESS' : 'ERROR'}
                              </span>
                              <div className="text-xs font-mono text-gray-300">
                                {log.ip.split(',')[0]}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <span className={`px-2 py-1 bg-white/5 text-gray-300 border border-white/10 rounded text-[10px] font-mono`}>
                                {log.endpoint}
                              </span>
                            </td>
                            <td className="p-4 align-top text-xs font-mono text-gray-400">
                              {log.model}
                            </td>
                            <td className="p-4 align-top text-sm text-gray-300">
                              <div className={`font-bold mb-1 flex items-center gap-2 ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {log.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                {log.message || log.error}
                              </div>
                              <div className="text-[10px] text-gray-400 whitespace-pre-wrap break-all overflow-y-auto max-h-48 p-3 bg-black/60 rounded-lg border border-white/5 font-mono mb-2 shadow-inner">
                                {log.detail}
                              </div>
                              {log.result && (
                                <div className="space-y-2 mt-3">
                                  <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1"><Server className="w-3 h-3" /> 响应结果 (RESULT)</div>
                                  <div className="text-[10px] text-gray-500 whitespace-pre-wrap break-all overflow-y-auto max-h-48 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 font-mono shadow-inner">
                                    {log.result}
                                  </div>
                                  {/* 检测图片并预览 */}
                                  {(() => {
                                    try {
                                      const res = JSON.parse(log.result);
                                      const imgUrl = res.imageUrl || (res.data && res.data[0]?.url) || (res.data && res.data[0]?.b64_json);
                                      if (imgUrl) {
                                        const isTruncated = typeof imgUrl === 'string' && imgUrl.includes('TRUNCATED');
                                        return (
                                          <div className="mt-2 relative">
                                            <div className="text-[9px] text-emerald-500/50 mb-1 flex items-center gap-1"><ImageIcon className="w-2.4 h-2.4" /> 调度系统截获到生成图像：</div>
                                            {isTruncated ? (
                                              <div className="flex items-center gap-2 p-3 bg-black/40 border border-white/5 rounded-lg mt-1 w-full max-w-sm">
                                                <ImageIcon className="w-4 h-4 text-emerald-500/50 flex-shrink-0" />
                                                <span className="text-[10px] text-gray-500 leading-tight">由于图像 Base64 较长，为了优化列表获取速度并减少内存占用，调度日志已将该请求的数据阶段截断。前端控制台已输出完整结果。</span>
                                              </div>
                                            ) : (
                                              <div className="relative group w-32 h-32">
                                                <img 
                                                  src={imgUrl.startsWith('data:image') || imgUrl.startsWith('http') ? imgUrl : `data:image/png;base64,${imgUrl}`} 
                                                  alt="Preview" 
                                                  className="w-full h-full object-cover rounded-lg border border-white/10 shadow-lg shadow-black/50 cursor-zoom-in"
                                                  onClick={() => window.open(imgUrl.startsWith('data:image') || imgUrl.startsWith('http') ? imgUrl : `data:image/png;base64,${imgUrl}`, '_blank')}
                                                />
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const link = document.createElement('a');
                                                    link.href = imgUrl.startsWith('data:image') || imgUrl.startsWith('http') ? imgUrl : `data:image/png;base64,${imgUrl}`;
                                                    link.download = `ai-gen-${Date.now()}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                  }}
                                                  className="absolute bottom-1 right-1 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-md shadow-lg transition-all flex items-center gap-1 z-10 opacity-100 shadow-black"
                                                  title="下载图片"
                                                >
                                                  <Download className="w-3 h-3" />
                                                  <span className="text-[9px] font-bold">下载</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    } catch (e) { return null; }
                                  })()}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'docs' ? (
            /* API docs View */
            <div className="animate-in fade-in duration-300 pb-10 pr-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <FileCode className="w-8 h-8 text-purple-500" />
                  架构与分发手册 (Integration)
                </h2>
                <p className="text-gray-400 text-sm">提供给您国内阿里云/私有平台的 API 文档，支持标准 OpenAI 格式与多媒体网关路由。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-12 lg:col-span-8 space-y-6">
                  {/* Base Info */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/5 pb-2">1. 网关鉴权信息</h3>
                    <div className="space-y-4">
                      <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] text-purple-400/60 uppercase font-bold mb-1">API 端点 (Base URL)</div>
                            <code className="text-xs text-white block bg-black/40 p-2 rounded border border-white/10">{window.location.origin}/api/v1</code>
                          </div>
                          <div>
                            <div className="text-[10px] text-purple-400/60 uppercase font-bold mb-1">鉴权方式 (Auth)</div>
                            <code className="text-xs text-white block bg-black/40 p-2 rounded border border-white/10">Bearer {password || '您的私有锁'}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Code Example */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/5 pb-2">2. 生图节点分发代码 (Python Example)</h3>
                    <div className="relative group">
                      <pre className="text-[11px] text-gray-300 bg-black/60 p-4 rounded-xl border border-white/5 font-mono overflow-auto max-h-[500px]">
{`import requests
import json

# 配置您的网关信息
API_URL = "${window.location.origin}/api/v1/generate"
API_KEY = "${password || '您的网关私有锁'}"

def generate_image(prompt, model="gemini-3.1-flash-image-preview", size="4K"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,          # 模型 ID
        "prompt": prompt,         # 提示词
        "imageSize": "4K",        # 支持 1K, 2K, 4K 或 512, 1024
        "aspectRatio": "16:9",    # 1:1, 16:9, 9:16, 4:3, 3:4
        "referenceImage": None    # 支持传入 Data URI Base64 进行垫图
    }
    
    # 也支持标准 OpenAI 格式: /v1/images/generations
    # 通用参数 size: "4096x2304" 会自动映射为 4K
    
    response = requests.post(API_URL, headers=headers, json=payload)
    result = response.json()
    
    if result.get("success"):
        print(f"生成成功! 链接: {result.get('imageUrl')}")
        return result.get("imageUrl")
    else:
        print(f"生成失败: {result.get('error')}")
        return None

# 测试调用 4K 16:9
generate_image("赛博朋克风格的未来城市，雨夜，霓虹灯", size="4K")`}
                      </pre>
                    </div>
                  </div>

                  {/* Resolution Table */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/5 pb-2">尺寸与分辨率映射 (Resolution Mapping)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400">
                            <th className="py-2 pr-4">参数值 (imageSize / size)</th>
                            <th className="py-2 pr-4">Gemini 内部映射</th>
                            <th className="py-2">建议场景</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-emerald-400 font-mono">4K / 4096x2304</td>
                            <td className="py-2">4K</td>
                            <td className="py-2">超高清展示、壁纸</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-blue-400 font-mono">2K / 2048x2048</td>
                            <td className="py-2">2K</td>
                            <td className="py-2">高清社交平台分享</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-gray-400 font-mono">1K / 1024x1024 / dall-e-3 default</td>
                            <td className="py-2">1K</td>
                            <td className="py-2">常规生图、标准预览</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Standard OpenAI Example */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/5 pb-2">3. 标准 OpenAI 兼容调用 (推荐库接入)</h3>
                    <p className="text-[11px] text-gray-500 mb-4">如果您的平台基于 OpenAI SDK 开发，只需替换 Base URL 和 API Key 为本网关，即可无缝支持 Gemini / DALL-E。</p>
                    <pre className="text-[10px] text-gray-400 bg-black/60 p-4 rounded-xl border border-white/5 font-mono">
{`from openai import OpenAI

client = OpenAI(
    api_key="${password || '您的网关私有锁'}",
    base_url="${window.location.origin}/api/v1"
)

# 像调用 DALL-E 一样调用我们的 Gemini
response = client.images.generate(
    model="gemini-3.1-flash-image-preview",
    prompt="A futuristic city with flying cars",
    size="1024x1024",
    quality="standard",
    n=1,
)

image_url = response.data[0].url`}
                    </pre>
                  </div>
                </div>

                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                  {/* Model Directory */}
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-purple-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" /> 已接通模型目录 (ID)
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-white font-bold opacity-80">谷歌 Gemini 系列</div>
                        <code className="text-[10px] text-purple-400 block mt-1">gemini-3.1-flash-image-preview</code>
                        <code className="text-[10px] text-purple-400 block">gemini-3-pro-image-preview</code>
                        <div className="text-[9px] text-gray-500 mt-1">支持：垫图、比例修改、快速生成</div>
                      </div>
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-white font-bold opacity-80">谷歌 Imagen 系列</div>
                        <code className="text-[10px] text-emerald-400 block mt-1">imagen-3.0-fast-generate-preview</code>
                      </div>
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-white font-bold opacity-80">OpenAI DALL-E 系列</div>
                        <code className="text-[10px] text-blue-400 block mt-1">dall-e-3</code>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-orange-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> 部署注意事项
                    </h3>
                    <div className="space-y-3 text-[11px] text-gray-400">
                      <p className="flex gap-2">
                        <span className="text-orange-500 font-bold">●</span>
                        <span className="text-white/80">IP 白名单：</span> 如果您从业务服务器大批量调用，请在控制面板将服务器 IP 填入白名单，以开启 <span className="text-orange-400">8路高并发</span> 生成模式。
                      </p>
                      <p className="flex gap-2">
                        <span className="text-orange-500 font-bold">●</span>
                        <span className="text-white/80">内容审核：</span> 网关内置敏感词过滤，如命中违规词将返回 403 状态码。
                      </p>
                      <p className="flex gap-2">
                        <span className="text-orange-500 font-bold">●</span>
                        <span className="text-white/80">Base64 垫图：</span> `referenceImage` 字段最大支持 50MB 的 Base64 数据包。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'settings' as any ? (
            /* Settings View */
            <div className="animate-in fade-in duration-300 pb-10 pr-8">
              {!isSettingsUnlocked ? (
                <div className="flex flex-col items-center justify-center pt-20 h-full">
                  <Shield className="w-16 h-16 text-rose-500 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                  <h2 className="text-2xl font-bold text-white mb-2">安全验证</h2>
                  <p className="text-gray-400 text-sm mb-8">本页面涉及系统核心 API 密钥安全，请输入网关私有锁以继续</p>
                  
                  <form onSubmit={handleSettingsUnlock} className="w-full max-w-md">
                    <div className="relative mb-4">
                      <input 
                        type="text"
                        style={{ WebkitTextSecurity: 'disc' }}
                        value={settingsPassword}
                        onChange={(e) => setSettingsPassword(e.target.value)}
                        placeholder="请输入网关私有锁 (PROXY_SECRET_KEY)"
                        name="settings_secret_key_prevent_autofill"
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-sm text-center text-white focus:outline-none focus:border-rose-500 font-mono focus:ring-1 focus:ring-rose-500/50 transition-all placeholder-white/20 shadow-inner"
                      />
                    </div>
                    {settingsUnlockError && (
                      <p className="text-rose-500 text-sm mb-4 text-center">{settingsUnlockError}</p>
                    )}
                    <button 
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-rose-900/50 flex items-center justify-center gap-2 group"
                    >
                      验证并开启控制面板
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                      <Shield className="w-8 h-8 text-rose-500" />
                      控制面板 (Settings)
                    </h2>
                    <p className="text-gray-400 text-sm">配置网关的高级权限与自动防御系统。修改后即时生效。</p>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-4">安全与并发白名单配置 (IP Whitelist)</h3>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                      <h4 className="text-blue-400 text-sm font-bold flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4" />
                        白名单并发特权说明
                      </h4>
                      <ul className="list-disc list-inside text-sm text-blue-200/70 space-y-1">
                        <li>普通 IP 生成多媒体会被限制为 <span className="font-bold text-white">最高 15次/分钟</span>，且 <span className="font-bold text-white">同节点只允许 1路 异步生成排队</span>。</li>
                        <li>网关探测此 IP 并将其填入白名单后（如您国内业务服务器），系统直接穿透上述限速池。</li>
                        <li>您的源将即刻激活 <span className="font-bold text-emerald-400">并行扩容：8路极速多媒体高并发流生成通道</span>，并无上限。</li>
                        <li><span className="text-rose-400">注意：</span> 修改该区域配置将即时覆盖本节点生效。</li>
                      </ul>
                    </div>

                <div className="space-y-6">
                  <div className="border-t border-white/5 pt-6 mt-6">
                    <h3 className="text-lg font-bold text-white mb-4">大模型厂商 API 密钥管理 (API Keys)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
                        <input 
                          type="text"
                          value={adminGeminiKey}
                          onChange={(e) => setAdminGeminiKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="AI Studio 获取的 API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">OpenAI API Key</label>
                        <input 
                          type="text"
                          value={adminOpenaiKey}
                          onChange={(e) => setAdminOpenaiKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="OpenAI 官方 API Key (sk-...)"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">OpenAI Base URL / 统一中转网关 (如果没有专门设置MJ/Flux，将默认走此通道)</label>
                        <input 
                          type="text"
                          value={adminOpenaiBaseUrl}
                          onChange={(e) => setAdminOpenaiBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="例如：https://api.openai-proxy.com/v1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                      <div className="md:col-span-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 mb-4">
                        <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                          <Bot className="w-4 h-4" /> Midjourney 接入模式说明
                        </h4>
                        <div className="flex gap-4 mb-4">
                          <button 
                            onClick={() => setAdminMjMode('openai')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm transition-all ${adminMjMode === 'openai' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 opacity-60 hover:opacity-100'}`}
                          >
                            <span className="font-bold block mb-0.5">标准 OpenAI 模式</span>
                            <span className="text-[10px] opacity-70">适配国内各大中转站、Forward 转发接口</span>
                          </button>
                          <button 
                            onClick={() => setAdminMjMode('task')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm transition-all ${adminMjMode === 'task' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 opacity-60 hover:opacity-100'}`}
                          >
                            <span className="font-bold block mb-0.5">Proxy 任务模式</span>
                            <span className="text-[10px] opacity-70">适配 novicezk/midjourney-proxy 自搭开源方案</span>
                          </button>
                        </div>
                        
                        {adminMjMode === 'task' && (
                          <div className="text-[11px] text-gray-500 space-y-1.5 font-mono">
                            <p>1. 准备一个付费 MJ 账号，并获取 <span className="text-emerald-400">Discord Token / 服务器 ID / 频道 ID</span>。</p>
                            <p>2. 部署开源项目 <span className="text-emerald-400">midjourney-proxy</span> 并获得本地/公网 API 地址。</p>
                            <p>3. 在下方输入该地址并将 Key 设置为你在 proxy 中定义的 <span className="text-emerald-400">mj-api-secret</span>。</p>
                            <p>4. 统一网关将自动接管“任务提交-轮询结果”的全过程并返回最终图床链接。</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Midjourney API Key (可选)</label>
                        <input 
                          type="text"
                          value={adminMidjourneyKey}
                          onChange={(e) => setAdminMidjourneyKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="覆盖默认的 OpenAI Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Midjourney Base URL (中转代理地址)</label>
                        <input 
                          type="text"
                          value={adminMidjourneyBaseUrl}
                          onChange={(e) => setAdminMidjourneyBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono mb-2"
                          placeholder="例如：https://api.mj-proxy.com/v1"
                        />
                        <p className="text-xs text-gray-500">注：MJ 官方无开放 API，需配置支持 OpenAI 格式的第三方代理地址。</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Flux 2 API Key (可选)</label>
                        <input 
                          type="text"
                          value={adminFluxKey}
                          onChange={(e) => setAdminFluxKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="覆盖默认的 OpenAI Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Flux 2 Base URL (中转代理地址)</label>
                        <input 
                          type="text"
                          value={adminFluxBaseUrl}
                          onChange={(e) => setAdminFluxBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono mb-2"
                          placeholder="例如：https://api.flux-proxy.com/v1"
                        />
                        <p className="text-xs text-gray-500">注：通过国内统一中转网关调用时填写，需兼容 OpenAI 接口规范。</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">即梦 Jimeng (Dreamina) API Key</label>
                        <input 
                          type="text"
                          value={adminJimengKey}
                          onChange={(e) => setAdminJimengKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="Volcengine Ark (火山引擎) API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">即梦 Jimeng Base URL</label>
                        <input 
                          type="text"
                          value={adminJimengBaseUrl}
                          onChange={(e) => setAdminJimengBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="例如：https://ark.cn-beijing.volces.com/api/v3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">可灵 Kling AI API Key</label>
                        <input 
                          type="text"
                          value={adminKlingKey}
                          onChange={(e) => setAdminKlingKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="Kling AI 官网获取的 API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">可灵 Kling Base URL</label>
                        <input 
                          type="text"
                          value={adminKlingBaseUrl}
                          onChange={(e) => setAdminKlingBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="例如：https://api.klingai.com/v1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DeepSeek */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                      DeepSeek 深度求索
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">DeepSeek API Key</label>
                        <input 
                          type="text"
                          value={adminDeepseekKey}
                          onChange={(e) => setAdminDeepseekKey(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 font-mono"
                          placeholder="DeepSeek 官方 API Key 或中转 Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">DeepSeek Base URL</label>
                        <input 
                          type="text"
                          value={adminDeepseekBaseUrl}
                          onChange={(e) => setAdminDeepseekBaseUrl(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 font-mono"
                          placeholder="例如：https://api.deepseek.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                       白名单 IP 列表 (用英文逗号分隔)
                    </label>
                    <textarea 
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      className="w-full h-32 bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-rose-500 font-mono focus:ring-1 focus:ring-rose-500/50 transition-all custom-scrollbar placeholder-white/20"
                      placeholder="例如: 127.0.0.1, 114.252.1.1, 8.8.8.8"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={saveConfig}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-900/50 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      立即保存系统所有配置 (Hot Reload)
                    </button>

                    {error && (
                      <span className="text-rose-500 text-sm flex items-center gap-2 animate-in slide-in-from-left-2">
                        <AlertTriangle className="w-4 h-4" /> {error}
                      </span>
                    )}

                    {configSaved && (
                      <span className="text-emerald-400 text-sm flex items-center gap-1 animate-in fade-in">
                        <Check className="w-4 h-4" /> 配置已即时应用到后端
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </main>
      </div>
    </div>
  );
}
