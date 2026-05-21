# 🛠️ 统一多模型 AI 网关 (Universal AI Gateway) 接入与开发对接手册
> 本手册专为您的第三方业务平台、AI 服务网站及调用客户端研发团队编写。本网关支持强大的多模态聚合、全球大厂模型调度（Gemini、DeepSeek、OpenAI、火山即梦、快手可灵、Sora、Midjourney、Flux等），并支持将中国大陆阿里云/腾讯云等节点一键代理转发至新加坡物理高速网关。

---

## 1. 🌐 架构拓扑与阿里云中继中转方案 (Architecture & Proxy Topology)

国内阿里云 ECS 服务器调用海外 API 或是调用新加坡网关服务器时，常因为跨境公网骨干网（GFW）、跨国高延迟（400ms+）、或大厂密钥授权IP限制导致 **经常性连接失败、请求超时或被拒（Fetch errors / Timeouts）**。

为此，我们在网关中创新地实现了 **「双向透明中继代理技术 (Dual-way Transparent Relay Proxy)」**。

### 16.1 物理中继网络拓扑图
```
[您的国内第三方业务网站 / 阿里云ECS]
              │ (国内低延迟连接)
              ▼
    [您的中转网关 (国内节点)]
              │
              │ 🚀 (通过 EXTERNAL_GATEWAY_URL 在底层打通高速通道隧道)
              ▼
   [您的超级统一网关 (新加坡高速节点)] ―― 极速互联 ――► [OpenAI / Gemini / 可灵 / 即梦 底层官方API]
```

### 16.2 阿里云中继极速接入步骤
1. **获取新加坡网关物理地址**（例如：`http://172.96.160.174:3000` 或 `http://sg-gateway.yourdomain.com`）。
2. 在您的国内网站服务器、或国内阿里云部署的网关目录下的 `.env` 文件中配置该地址：
   ```env
   # 在您的国内阿里云网关项目的 .env 中填入新加坡网关公网首地址，全功能将在底层完成一键委派中转！
   EXTERNAL_GATEWAY_URL=http://<您的新加坡网关IP或域名>:3000
   ```
3. 重启国内网关服务后，所有来自于您第三方网站的 `/api/*` 以及 `/v1/*` 流量将**自动、无感、高稳定性地以专线中继形式**透传给新加坡大底座。彻底解决直连超时及连接报错！

---

## 2. 🔑 核心全局接入鉴权 (Authentication)

调用网关需要统一进行 HTTP Header 的 Bearer Token 形式鉴权。

* **网关统一基础 URL (Base URL)**: `http://<您的网关域名或阿里云公网IP>:3000/api/v1`
* **首选择 Headers**:
  ```http
  Authorization: Bearer <您的网关私有锁口令 / PROXY_SECRET_KEY>
  Content-Type: application/json
  ```

---

## 3. 🛡️ 统一超融合 API 规范 (Universal Custom Gateway: `POST /api/v1/generate`)

这是最推荐在多模态、文生图、文生视频中使用的融合接口，网关底层会根据您传入的 `model` 进行调度，自适应调用不同的上游服务，并将轮询（Polling）异步任务全部在网关内化，直接带回生成的最终媒体链接，免去您在客户端写繁琐的轮询逻辑。

* **请求端点**: `POST /api/v1/generate`
* **请求头 (Headers)**:
  - `Content-Type: application/json`
  - `Authorization: Bearer 您的网关私有锁口令`

### 📥 完整请求参数表 (Request Body JSON)

| 参数名 | 类型 | 是否必填 | 默认值 | 约束与说明 |
| :--- | :--- | :--- | :--- | :--- |
| **`model`** | `string` | **是** | - | 支持以下平台和模型：<br>• **文本/对话**: `gemini-3.5-flash`, `deepseek-chat`, `deepseek-reasoner`<br>• **主流生图**: `gemini-3.1-flash-image-preview`<br>• **专业生图**: `midjourney`, `flux`, `dall-e-3`<br>• **火山即梦生图**: `jimeng-5.0`, `jimeng-4.5`<br>• **火山即梦生视频**: `doubao-seedance-2.0`, `doubao-seedance-2.0-fast`<br>• **快手可灵视频**: `kling-video-o1` (可灵O1), `kling-v3-omni` (可灵V3), `kling-v1-5`<br>• **OpenAI 视频**: `sora` |
| **`prompt`** | `string` | **是** | - | 提示词或描述性指令。对视频或图像生成有高重要性。 |
| **`size`** / **`imageSize`** | `string` | 否 | `1024x1024` | 媒体分辨率尺寸，自适应匹配：<br>• 图像：可为 `1024x1024` / `1K`、`2048x2048` / `2K`、`4096x2304` / `4K` 等。<br>• 视频：默认为 `720p`、高精生视频写 `1080p`（火山 fast 模型会自动回弹为 `720p`）。 |
| **`aspectRatio`** | `string` | 否 | `1:1` | 支持主流宽高比例，**仅接受严格比例**：<br>• `1:1` (正方形)<br>• `16:9` (宽屏)<br>• `9:16` (竖屏)<br>*注：由于大厂官方要求，已剔除不规范的 4:3 和 3:4。* |
| **`referenceImage`** | `string` | 否 | `null` | 垫图/图片参考（用于“图生视频”、“图生图”）。<br>支持传入 **`https://...` 图像公网URL** 或 **`data:image/jpeg;base64,...` 的 Base64 字符串**。 |
| **`referenceVideo`** | `string` | 否 | `null` | 视频参考（用于“视频生成视频”）。仅对可灵系列及即梦视频模型有效。支持传入可以公开下载的视频 URL。|
| **`duration`** | `number`/`string`| 否 | `5` | 生成的视频秒数。通常为 `5` 或 `10`（根据底层服务提供商决定）。 |

---

### 📤 格式化的统一返回 JSON 示例

#### 🎨 场景 A：文本与多模态对话、大底座推理返回 (Chat / DeepSeek R1)
```json
{
  "success": true,
  "text": "> **思考过程 (Reasoning):**\n> 正在寻找最佳快速排序方案...\n\n---\n\n这是您的快速排序算法代码如下...",
  "estimatedCostUsd": 0.00124
}
```

#### 🖼️ 场景 B：图像生成成功返回 (Gemini / DALL-E / Flux / MJ)
```json
{
  "success": true,
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // 或者可供公网直接访问、已缓存的图片 URL
  "estimatedCostUsd": 0.03
}
```

#### 🎥 场景 C：视频生成成功返回 (已由网关自动完成异步轮询)
```json
{
  "success": true,
  "videoUrl": "https://yoursg-gateway.com/temp/2f7bb7fa-4ca8-477d.mp4", // 已成功在网关下载缓存的视频公网下载直链
  "estimatedCostUsd": 0.35
}
```

---

## 4. 🔗 标准 OpenAI 兼容适配器调用说明 (OpenAI Drops-In)

如果您开发的第三方 AI 网站使用了标准 OpenAI SDK 库，可以直接通过参数无感平替。

### 🌟 4.1 文本对话接口 (Chat Completions)
* **API 路径**: `POST /api/v1/chat/completions` (或 `/v1/chat/completions`)
* **支持模型名 (`model`)**: `gemini-3.5-flash`, `deepseek-chat`, `deepseek-reasoner`, `gpt-4o` 等
* **请求示例**:
  ```json
  {
    "model": "deepseek-reasoner",
    "messages": [
      { "role": "user", "content": "为什么可灵视频生成模型走 omni-video 接口支持更多控制？" }
    ],
    "stream": true
  }
  ```
  *本网关完全支持 `SSE (Server-Sent Events) 流式边下边读`。在您中转阿里云网关与新加坡网关中，流数据将被无感级透明保真转发。*

### 🌟 4.2 图像生成接口 (Images Generations)
* **API 路径**: `POST /api/v1/images/generations` (或 `/v1/images/generations`)
* **支持模型名 (`model`)**: `gemini-3.1-flash-image-preview`, `dall-e-3`, `midjourney`, `flux` 等
* **主要映射约束**: 本网关会自动解析 OpenAI 传入的 `size` 对应至统一比例参数中。

### 🌟 4.3 视频生成接口 (Videos Generations)
* **API 路径**: `POST /api/v1/videos/generations` (或 `/v1/videos/generations`)
* **支持模型名 (`model`)**: `kling-video-o1`, `kling-v3-omni`, `doubao-seedance-2.0`
* **特别优化：自适应图生视频 (Image-to-Video)**:
  如果您在请求中传入了 `image_url`，网关会自动识别为快手可灵官方协议下所需的 **「垫图生成模式」**，并在底层将接口中继分发至最新款的 **`/videos/omni-video`** 接口进行渲染！对于第三方开发者极度友好。

---

## 5. 💻 主流开发语言对接最佳实践 (Code Examples)

### 🐍 5.1 Python 示例 (OpenAI SDK)
```python
from openai import OpenAI

client = OpenAI(
    api_key="您的网关私有锁口令",
    # 填入国内阿里云网关服务器的公网链接（如 3000 端口）
    base_url="http://47.79.225.28:3000/api/v1" 
)

# 1. 自动中继路由视频生成 (以快手可灵最新 O1 视频为例)
print("正在通过国内网站向网关提交可灵O1文生视频任务...")
video_job = client.post(
    "/generate",
    body={
        "model": "kling-video-o1",
        "prompt": "一只憨态可掬的小熊猫在雪地里玩雪，阳光温暖，大景深电影质白",
        "aspectRatio": "16:9",
        "duration": 5
    }
)
print("网关托管轮询完成！视频高速下载链:", video_job.get("videoUrl"))
```

### 🟩 5.2 Node.js / TypeScript 示例
```typescript
import fetch from 'node-fetch';

async function generateMedia() {
  const GATEWAY_URL = "http://47.79.225.28:3000/api/v1/generate";
  const PROXY_TOKEN = "您的网关私有锁口令";

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PROXY_TOKEN}`
    },
    body: JSON.stringify({
      model: "kling-video-o1",
      prompt: "中国山水之间的悬浮奇迹城市，科幻和古风碰撞，有飞艇，云雾飞卷，4k画质",
      aspectRatio: "16:9",
      duration: 5
    })
  });

  const resJson = await response.json();
  if (resJson.success) {
    console.log("🎥 视频物理缓存直链：", resJson.videoUrl);
    console.log("💰 本次生成预估成本：", resJson.estimatedCostUsd, "USD");
  } else {
    console.error("❌ 网关调度报错：", resJson.error);
  }
}

generateMedia().catch(console.error);
```

### ☕ 5.3 Java 示例 (OkHttp3 方案)
```java
import okhttp3.*;
import java.io.IOException;

public class GatewayDispatcher {
    private static final String API_URL = "http://47.79.225.28:3000/api/v1/generate";
    private static final String AUTH_TOKEN = "Bearer 您的网关私有锁口令";

    public static void main(String[] args) throws IOException {
        OkHttpClient client = new OkHttpClient();

        String jsonPayload = "{"
                + "\"model\": \"kling-video-o1\","
                + "\"prompt\": \"雪原上高速狂奔中的雪豹，极寒，摄影机跟拍质感\","
                + "\"aspectRatio\": \"16:9\","
                + "\"size\": \"1080p\""
                + "}";

        RequestBody body = RequestBody.create(
                jsonPayload, MediaType.parse("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(API_URL)
                .addHeader("Authorization", AUTH_TOKEN)
                .post(body)
                .build();

        System.out.println("⏳ 正在提交任务至阿里云，底层经由新加坡物理核心托管生成...");
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                System.out.println("🎯 生成成功！网关原始响应: " + response.body().string());
            } else {
                System.err.println("❌ 调度失败，HTTP错误码: " + response.code() + ", 详情: " + response.body().string());
            }
        }
    }
}
```

### 🐹 5.4 Go 示例
```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type GatewayRequest struct {
	Model       string `json:"model"`
	Prompt      string `json:"prompt"`
	AspectRatio string `json:"aspectRatio"`
}

func main() {
	url := "http://47.79.225.28:3000/api/v1/generate"
	payload := GatewayRequest{
		Model:       "kling-video-o1",
		Prompt:      "雨中的复古街道，地面的水坑透出彩色的红霓虹微缩，柔和落雨特效",
		AspectRatio: "16:9",
	}

	bodyBytes, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer 您的网关私有锁口令")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	responseBody, _ := io.ReadAll(resp.Body)
	fmt.Println("🚀 网关聚合异步响应：", string(responseBody))
}
```

### 🐘 5.5 PHP 示例
```php
<?php
$ch = curl_init();

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer 您的网关私有锁口令'
];

$payload = json_encode([
    'model' => 'kling-video-o1',
    'prompt' => '赛博风格水族馆、巨大的机械彩色鲸鱼在云端发光穿过楼宇，高清超炫视效',
    'aspectRatio' => '16:9',
    'duration' => 5
]);

curl_setopt($ch, CURLOPT_URL, "http://47.79.225.28:3000/api/v1/generate");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // 10s TCP握手超时限制
curl_setopt($ch, CURLOPT_TIMEOUT, 300);        // 视频轮询等待时长最大设置300秒

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($http_code === 200) {
    $result = json_decode($response, true);
    echo "🎉 生成并托管轮询成功！高清视频链接：" . $result['videoUrl'];
} else {
    echo "🚨 调用受阻，HTTP 状态码：" . $http_code . "，返回详情：" . $response;
}

curl_close($ch);
?>
```

---

## 6. 🔍 异常代码诊断与防踩坑指南 (Troubleshooting Deck)

如果第三方业务网站调用时产生异常，请比对并排查以下提示：

### 🛑 6.1 `502 Bad Gateway` (新加坡网关节点连接失败)
* **故障现象**: 反馈：`新加坡网关节点连接失败 (Singapore Gateway Connection Timeout)`。
* **排查方式**: 这是最经典的国内网络跨境链路报错。
  1. 请先检查您在 `.env` 中指定的 `EXTERNAL_GATEWAY_URL` 的 IP 是否填写错误、或携带了多余的空格。
  2. 检查您的新加坡物理服务器上，云服务商的 **「防火墙安全组 (Firewall Security Group)」** 是否放行了 **3000** 端口。如果 3000 端口没有对公网（`0.0.0.0/0`）完全开放接入，国内阿里云将无法与中转机制建连。

### 🛑 6.2 `429 Too Many Requests` (请求频率被锁)
* **故障现象**: 反馈：`网关探测到您的源 IP 请求频率异常。请降低并发请求速度。`
* **排查方式**: 网关内置防 CC/防抖流控保障。
  - 解决方法：请在**控制面板（Settings）**页，将您国内阿里云应用主机的**固定公网 IP** 填入**「安全白名单 (IP Whitelist)」**。加入白名单后即可享受极速千级并发、不限频次的安全优待通道。

### 🛑 6.3 `403 Forbidden` / `401 Unauthorized` (口令错误)
* **故障现象**: 报 `无访问权限（Unauthenticated）` 错误。
* **排查方式**:
  1. 请检查您的 `Authorization` 头中，是否有拼写错误，或者多写/少写了 `Bearer ` 前缀（注意 `Bearer` 和您的密码口令之间有且仅有一个半角空格）。
  2. 检查在您所调用的网关控制面板里，所设置的客户端私有口令参数（`PROXY_SECRET_KEY`）是否和代码里完全一致。

### 🛑 6.4 `400 Bad Request` (参数格式错)
* **故障现象**: 返回 `Missing prompt/model` 或是 `model is not supported`。
* **排查方式**:
  - 重点排查 `aspectRatio`，可灵和即梦接口只接受极其规则的水平均分比例。**只传入 `1:1`、`16:9`、`9:16` 即可**。不要传入已废弃的旧版本 `4:3` / `3:4` 等比例。
