# 🛠️ 网页多媒体网关 API 接入与开发对接手册 (Alibaba Cloud & External Platform Integration)

本手册专为您的网站 **AI 编程开发团队** 编写，包含了标准 OpenAI 兼容调用与专属多媒体网关（生图、生视频、文字生成）的完整接入代码与最佳实践。

---

## 1. 核心网关配置信息

您的业务服务器（如此次部署在**阿里云/腾讯云**等国内节点的 ECS 实例）可以直接调用本网关。网关已在外部接入、跨域（CORS）、以及安全限流层面为高并发做好配置。

| 配置项 | 详细参数值 | 备注说明 |
| :--- | :--- | :--- |
| **基础 API 端点 (Base URL)** | `https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1` | 兼容 `/v1` 或 `/v1/v1` 开头的端点 |
| **鉴权密钥 (API Key / Token)** | `Bearer <您的网关私有锁>` | 在控制面板 (Settings) 处配置的 `PROXY_SECRET_KEY` |
| **受支持的比例 (Aspect Ratio)** | `1:1`, `16:9`, `9:16` | **注意：** 已废弃非官方支持的 `4:3` 与 `3:4` 比例 |

> 💡 **阿里云服务器调用最佳实践：**
> 在您的网关控制面板中把您的阿里云服务器的公网 IP 填入 **安全与并发白名单 (IP Whitelist)**。填入后即可享受原生的 **最高8路异步多媒体并发生成** 的高性能调度特权，避开普通单 IP 每分钟最多 15 次的流控安全屏障。

---

## 2. 推荐方式：标准 OpenAI 客户端库接入 (兼容 DALL-E & Chat)

如果您的网站已经引入了 `openai` 的底层 SDK，直接将 `base_url` 和 `api_key` 修改为本网关，程序架构无需任何重构。

### 🐍 Python 示例 (OpenAI Python SDK)
```python
from openai import OpenAI

# 初始化客户端，指向本网关
client = OpenAI(
    api_key="您的网关私有锁口令",
    base_url="https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1"
)

# 1. 调用多功能生图接口 (兼容 DALL-E)
image_response = client.images.generate(
    model="gemini-3.1-flash-image-preview",  # 推荐，或使用 "dall-e-3"
    prompt="一幅高度细节的中国风山水画，云雾缭绕，微缩盆景效果，唯美，8k分辨率",
    size="1024x1024",  # 自动映射 1K (4K 建议传入 4096x2304)
    quality="standard",
    n=1
)
print("生成的图像链接:", image_response.data[0].url)

# 2. 调用聊天对话/文本多模态推理接口 (兼容 Chat Completion)
chat_response = client.chat.completions.create(
    model="gemini-3.5-flash",  # 支持 gemini-3.5-flash, deepseek-chat 等
    messages=[
        {"role": "system", "content": "你是一个资深的程序员，精通全栈工程架构。"},
        {"role": "user", "content": "请写一个快速排序算法的最佳实践。"}
    ],
    temperature=0.7
)
print("AI 回复:", chat_response.choices[0].message.content)
```

### 🟩 Node.js / JavaScript (OpenAI Node SDK)
```javascript
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "您的网关私有锁口令",
  baseURL: "https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1"
});

async function main() {
  // 生成图
  const image = await openai.images.generate({
    model: "gemini-3.1-flash-image-preview",
    prompt: "赛博朋克风格的未来城市，霓虹灯，雨夜",
    size: "1024x1024"
  });
  console.log("图像链接:", image.data[0].url);
}
main().catch(console.error);
```

---

## 3. 专属多媒体网关 API 端点调用 (原生 API Post)

如果您希望不依赖外部 SDK，直接通过底层 `HTTP POST` 请求与网关调度器完成高质量生图/生视频，请直接使用此 API。

### 端点：`POST /api/v1/generate`

#### 📥 请求 Payload (JSON Body)
```json
{
  "model": "gemini-3.1-flash-image-preview",
  "prompt": "赛博朋克风格的未来城市，霓虹灯，雨夜",
  "imageSize": "2K", 
  "aspectRatio": "16:9",
  "referenceImage": null 
}
```
*注：`referenceImage` 可传入 `data:image/jpeg;base64,...` 的 Base64 编码，即可开启垫图参考图生成通道。*

#### 📤 响应结果 JSON
成功生图后返回如下结构：
```json
{
  "success": true,
  "imageUrl": "https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/assets/...png",
  "estimatedCostUsd": 0.03
}
```

---

## 4. 其余常用后端开发语言调用示例

为方便您的多语种网站团队，提供以下一键复制的快速对接代码：

### ☕ Java 示例 (OkHttp)
```java
import okhttp3.*;
import java.io.IOException;

public class GatewayClient {
    public static void main(String[] args) throws IOException {
        OkHttpClient client = new OkHttpClient();

        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(mediaType, 
            "{\"model\": \"gemini-3.1-flash-image-preview\", \"prompt\": \"赛博朋克深空探索者\", \"imageSize\": \"1K\", \"aspectRatio\": \"1:1\"}");
        
        Request request = new Request.Builder()
            .url("https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1/generate")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer 您的网关私有锁口令")
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                System.out.println(response.body().string());
            } else {
                System.err.println("请求失败, 状态码: " + response.code());
            }
        }
    }
}
```

### 🐹 Go 示例 (go-openai 或 原生 net/http)
```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1/generate"
	payload := []byte(`{
		"model": "gemini-3.1-flash-image-preview",
		"prompt": "金色的秋天稻田，3D卡通风格",
		"imageSize": "1K",
		"aspectRatio": "16:9"
	}`)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
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

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("网关返回:", string(body))
}
```

### 🐘 PHP 示例 (cURL 快速调用)
```php
<?php
$ch = curl_init();

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer 您的网关私有锁口令'
];

$payload = json_encode([
    'model' => 'gemini-3.1-flash-image-preview',
    'prompt' => '山顶的红枫树，秋风漫卷，古风插画',
    'imageSize' => '1K',
    'aspectRatio' => '16:9'
]);

curl_setopt($ch, CURLOPT_URL, "https://ais-pre-woltmqgu6jysyfh5ljnnvm-342934410804.us-west2.run.app/api/v1/generate");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($http_code === 200) {
    $result = json_decode($response, true);
    echo "生图成功！图片链接：" . $result['imageUrl'];
} else {
    echo "调用出错，状态码：" . $http_code . "，回复：" . $response;
}

curl_close($ch);
?>
```

---

## 5. 网关错误代码及调度故障排查说明

当阿里云业务方调用出错时，请排查返回值或系统控制面板中的「调度监控系统」：

- **`401 Unauthorized`**
  - **原因**: 忘记携带 Header `Authorization` 或没有以 `Bearer ` 开头。
- **`403 Forbidden`**
  - **原因**: 私有锁口令不匹配，或者由于高频调度（超过流控）IP被临时封禁。
- **`400 Bad Request`**
  - **原因**: 参数不匹配。请注意：对于 `aspectRatio`，**只接受** `1:1`, `16:9`, `9:16`。不支持已被废弃的 `4:3` / `3:4`。
- **`500 Internal Server Error`**
  - **原因**: 底层大厂接口（API Key 无效、配额耗尽等）。请您的主管在**控制面板 (Settings)**页检查并补齐大厂的 API Key，或者由于大厂节点网络故障造成。请对照后台的「调度监控日志」来进一步定位。
