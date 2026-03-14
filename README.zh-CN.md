🌐 **语言:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 免费加密货币新闻 API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub 星标"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="许可证"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API 演示" width="700">
</p>

> ⭐ **如果您觉得有用，请给仓库点星！** 这有助于其他人发现这个项目并激励持续开发。

---
通过一次 API 调用从 7 个主要来源获取实时加密货币新闻。

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | 其他 |
|---|---|---|---|
| **价格** | 🆓 永久免费 | $29-299/月 | 付费 |
| **API 密钥** | ❌ 无需 | 需要 | 需要 |
| **速率限制** | 无限制* | 100-1000/天 | 有限制 |
| **来源** | 12 英语 + 12 国际 | 1 | 不等 |
| **国际化** | 🌏 韩语、中文、日语、西班牙语 + 翻译 | 否 | 否 |
| **自托管** | ✅ 一键部署 | 否 | 否 |
| **PWA** | ✅ 可安装 | 否 | 否 |
| **MCP** | ✅ Claude + ChatGPT | 否 | 否 |

---

## 🌍 国际新闻来源

从 18 种语言的 **75 个国际来源**获取加密货币新闻 — 自动翻译成英语！

### 支持的来源

| 地区 | 来源 |
|--------|---------|
| 🇰🇷 **韩国** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **中国** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **日本** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **拉丁美洲** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### 快速示例

```bash
# 获取所有国际新闻
curl "https://cryptocurrency.cv/api/news/international"

# 获取韩语新闻并翻译成英语
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# 获取亚洲地区新闻
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### 功能特点

- ✅ 通过 Groq AI **自动翻译**成英语
- ✅ **7 天翻译缓存**提高效率
- ✅ 保留**原文 + 英文**
- ✅ **速率限制**（1 请求/秒）尊重 API
- ✅ 不可用来源的**备用处理**
- ✅ 跨来源**去重**

---

## 📱 渐进式 Web 应用（PWA）

Free Crypto News 是一个**完全可安装的 PWA**，支持离线使用！

### 功能

| 功能 | 描述 |
|---------|-------------|
| 📲 **可安装** | 在任何设备上添加到主屏幕 |
| 📴 **离线模式** | 无需网络即可阅读缓存新闻 |
| 🔔 **推送通知** | 接收突发新闻提醒 |
| ⚡ **闪电般快速** | 激进的缓存策略 |
| 🔄 **后台同步** | 重新上线时自动更新 |

### 安装应用

**桌面（Chrome/Edge）：**
1. 访问 [cryptocurrency.cv](https://cryptocurrency.cv)
2. 点击地址栏中的安装图标（⊕）
3. 点击"安装"

**iOS Safari：**
1. 在 Safari 中访问网站
2. 点击分享（📤）→"添加到主屏幕"

**Android Chrome：**
1. 访问网站
2. 点击安装横幅或菜单 →"安装应用"

---

## 来源

我们从 **7 个可信媒体**聚合：

- 🟠 **CoinDesk** — 通用加密货币新闻
- 🔵 **The Block** — 机构与研究
- 🟢 **Decrypt** — Web3 与文化
- 🟡 **CoinTelegraph** — 全球加密货币新闻
- 🟤 **Bitcoin Magazine** — Bitcoin 极简主义者
- 🟣 **Blockworks** — DeFi 与机构
- 🔴 **The Defiant** — DeFi 原生

---

## 端点

| 端点 | 描述 |
|----------|-------------|
| `/api/news` | 所有来源的最新新闻 |
| `/api/search?q=bitcoin` | 按关键词搜索 |
| `/api/defi` | DeFi 专题新闻 |
| `/api/bitcoin` | Bitcoin 专题新闻 |
| `/api/breaking` | 仅过去 2 小时 |
| `/api/trending` | 带情绪的趋势话题 |
| `/api/analyze` | 带主题分类的新闻 |
| `/api/stats` | 分析与统计 |
| `/api/sources` | 列出所有来源 |
| `/api/health` | API 与 Feed 健康状态 |

### 🤖 AI 驱动端点（通过 Groq 免费）

| 端点 | 描述 |
|----------|-------------|
| `/api/summarize` | 文章的 AI 摘要 |
| `/api/ask?q=...` | 询问有关加密货币新闻的问题 |
| `/api/digest` | AI 生成的每日摘要 |
| `/api/sentiment` | 每篇文章的深度情绪分析 |
| `/api/entities` | 提取人物、公司、股票代码 |
| `/api/narratives` | 识别市场叙事和主题 |
| `/api/signals` | 基于新闻的交易信号（教育目的） |

---

## SDK 与组件

| 包 | 描述 |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` 即插即用组件 |
| [TypeScript](sdk/typescript/) | 完整的 TypeScript SDK |
| [Python](sdk/python/) | 零依赖 Python 客户端 |
| [JavaScript](sdk/javascript/) | 浏览器和 Node.js SDK |
| [Go](sdk/go/) | Go 客户端库 |
| [PHP](sdk/php/) | PHP SDK |

**基础 URL：** `https://cryptocurrency.cv`

---

## 响应格式

```json
{
  "articles": [
    {
      "title": "Bitcoin 创下新高",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin 突破了...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2小时前"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# 集成示例

选择您的平台。复制代码。部署。

---

## 🐍 Python

**零依赖。** 只需复制文件。

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# 获取最新新闻
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")
```

---

## 🟨 JavaScript / TypeScript

**在 Node.js 和浏览器中运行。**

### TypeScript SDK (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// 完全类型化的响应
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

---

# 自托管

## 一键部署

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## 手动

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

打开 http://localhost:3000/api/news

## 环境变量

**所有环境变量都是可选的。** 项目无需配置即可运行。

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | 启用 AI 摘要、分类和实时翻译（40+ 种语言）。**免费！** 在 [console.groq.com/keys](https://console.groq.com/keys) 获取 |

---

# 技术栈

- **运行时：** Next.js 14 Edge Functions
- **托管：** Vercel 免费版
- **数据：** 直接 RSS 解析（无数据库）
- **缓存：** 5 分钟边缘缓存

---

# 贡献

欢迎 PR！想法：

- [ ] 更多新闻来源
- [x] ~~情绪分析~~ ✅ 完成
- [x] ~~主题分类~~ ✅ 完成
- [x] ~~WebSocket 实时推送~~ ✅ 完成
- [ ] Rust / Ruby SDK
- [ ] 移动应用（React Native）

---

## 📚 文档

| 文档 | 描述 |
|----------|-------------|
| [用户指南](docs/USER-GUIDE.md) | 终端用户功能、键盘快捷键、PWA |
| [开发者指南](docs/DEVELOPER-GUIDE.md) | 架构、组件、扩展应用 |
| [贡献](CONTRIBUTING.md) | 如何贡献 |
| [变更日志](CHANGELOG.md) | 版本历史 |
| [安全](SECURITY.md) | 安全政策 |

---

# 许可证

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>停止为加密货币新闻 API 付费。</b><br>
  <sub>用 💜 为社区打造</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>觉得有用？请点星！</b> ⭐<br>
  <sub>帮助其他人发现这个项目并保持开发活跃</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="在 GitHub 上点星">
  </a>
</p>

