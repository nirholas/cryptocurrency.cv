🌐 **語言:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 免費加密貨幣新聞 API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub 星標"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="授權"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI 狀態"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API 展示" width="700">
</p>

> ⭐ **如果您覺得有用，請給倉庫點星！** 這有助於其他人發現這個專案並激勵持續開發。

---

透過一次 API 呼叫從 7 個主要來源獲取即時加密貨幣新聞。

```bash
curl https://cryptocurrency.cv/api/news
```

---

## 比較

| | Free Crypto News | CryptoPanic | 其他 |
|---|---|---|---|
| **價格** | 🆓 永久免費 | $29-299/月 | 付費 |
| **API 金鑰** | ❌ 無需 | 需要 | 需要 |
| **速率限制** | 無限制* | 100-1000/天 | 有限制 |
| **來源** | 12 英語 + 12 國際 | 1 | 不等 |
| **國際化** | 🌏 韓語、中文、日語、西班牙語 + 翻譯 | 否 | 否 |
| **自託管** | ✅ 一鍵部署 | 否 | 否 |
| **PWA** | ✅ 可安裝 | 否 | 否 |
| **MCP** | ✅ Claude + ChatGPT | 否 | 否 |

---

## 🌿 分支

| 分支 | 描述 |
|--------|-------------|
| `main` | 穩定生產分支 — 原始以 API 為中心的設計 |
| `redesign/pro-news-ui` | 高級 UI 重新設計 — CoinDesk/CoinTelegraph 風格，深色模式，增強組件，SEO 結構化數據和完整 PWA 支援 |

在本地測試重新設計：
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 國際新聞來源

從 **12 個國際來源**獲取加密貨幣新聞，包括韓語、中文、日語和西班牙語 — 自動翻譯成英語！

### 支援的來源

| 地區 | 來源 |
|--------|---------|
| 🇰🇷 **韓國** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **中國** | 8BTC (巴比特), Jinse Finance (金色財經), Odaily (星球日報) |
| 🇯🇵 **日本** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **拉丁美洲** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### 快速範例

```bash
# 獲取所有國際新聞
curl "https://cryptocurrency.cv/api/news/international"

# 獲取韓語新聞並翻譯成英語
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# 獲取亞洲地區新聞
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### 功能特點

- ✅ 透過 Groq AI **自動翻譯**成英語
- ✅ **7 天翻譯快取**提高效率
- ✅ 保留**原文 + 英文**
- ✅ **速率限制**（1 請求/秒）尊重 API
- ✅ 不可用來源的**備用處理**
- ✅ 跨來源**去重**

查看 [API 文檔](docs/API.md#get-apinewsinternational) 了解完整詳情。

---

## 📱 漸進式 Web 應用程式（PWA）

Free Crypto News 是一個**完全可安裝的 PWA**，支援離線使用。

### 功能

| 功能 | 描述 |
|---------|-------------|
| 📲 **可安裝** | 在任何裝置上新增至主畫面 |
| 📴 **離線模式** | 無需網路即可閱讀快取新聞 |
| 🔔 **推播通知** | 接收突發新聞提醒 |
| ⚡ **閃電般快速** | 積極的快取策略 |
| 🔄 **背景同步** | 重新上線時自動更新 |
| 🎯 **快捷鍵** | 快速訪問最新、熱門、比特幣 |
| 📤 **分享** | 直接分享連結到應用程式 |
| 🚨 **即時警報** | 可配置的價格和新聞條件警報 |

### 安裝應用程式

**桌面（Chrome/Edge）：**
1. 造訪 [cryptocurrency.cv](https://cryptocurrency.cv)
2. 點擊網址列中的安裝圖示（⊕）
3. 點擊「安裝」

**iOS Safari：**
1. 在 Safari 中造訪網站
2. 點擊分享（📤）→「加入主畫面」

**Android Chrome：**
1. 造訪網站
2. 點擊安裝橫幅或選單 →「安裝應用程式」

### Service Worker 快取

PWA 使用智慧快取策略：

| 內容 | 策略 | 快取時間 |
|---------|----------|----------------|
| API 回應 | Network-first | 5 分鐘 |
| 靜態資源 | Cache-first | 7 天 |
| 圖片 | Cache-first | 30 天 |
| 導航 | Network-first + 離線備用 | 24 小時 |

### 鍵盤快捷鍵

使用鍵盤快速導航新聞：

| 快捷鍵 | 動作 |
|----------|--------|
| `j` / `k` | 下一篇 / 上一篇 |
| `/` | 焦點搜尋 |
| `Enter` | 打開選中的文章 |
| `d` | 切換深色模式 |
| `g h` | 前往首頁 |
| `g t` | 前往趨勢 |
| `g s` | 前往來源 |
| `g b` | 前往書籤 |
| `?` | 顯示所有快捷鍵 |
| `Escape` | 關閉彈窗 |

📖 **完整用戶指南：** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## 來源

我們從 **7 個可信媒體**聚合：

- 🟠 **CoinDesk** — 通用加密貨幣新聞
- 🔵 **The Block** — 機構與研究
- 🟢 **Decrypt** — Web3 與文化
- 🟡 **CoinTelegraph** — 全球加密貨幣新聞
- 🟤 **Bitcoin Magazine** — Bitcoin 極簡主義者
- 🟣 **Blockworks** — DeFi 與機構
- 🔴 **The Defiant** — DeFi 原生

---

## 端點

| 端點 | 描述 |
|----------|-------------|
| `/api/news` | 所有來源的最新新聞 |
| `/api/search?q=bitcoin` | 按關鍵字搜尋 |
| `/api/defi` | DeFi 專題新聞 |
| `/api/bitcoin` | Bitcoin 專題新聞 |
| `/api/breaking` | 僅過去 2 小時 |
| `/api/trending` | 帶情緒的趨勢話題 |
| `/api/analyze` | 帶主題分類的新聞 |
| `/api/stats` | 分析與統計 |
| `/api/sources` | 列出所有來源 |
| `/api/health` | API 與 Feed 健康狀態 |
| `/api/rss` | 聚合 RSS feed |
| `/api/atom` | 聚合 Atom feed |
| `/api/opml` | RSS 閱讀器的 OPML 匯出 |
| `/api/docs` | 互動式 API 文檔 |
| `/api/webhooks` | 註冊 webhooks |
| `/api/archive` | 歷史新聞存檔 |
| `/api/push` | Web Push 通知 |
| `/api/origins` | 尋找新聞原始來源 |
| `/api/portfolio` | 基於投資組合的新聞 + 價格 |
| `/api/news/international` | 帶翻譯的國際來源 |

### 🤖 AI 驅動端點（透過 Groq 免費）

| 端點 | 描述 |
|----------|-------------|
| `/api/digest` | AI 生成的每日摘要 |
| `/api/sentiment` | 市場情緒分析 |
| `/api/summarize?url=` | 總結任何 URL |
| `/api/ask` | 詢問 AI 有關加密新聞 |
| `/api/entities` | 提取提到的實體 |
| `/api/claims` | 驗證聲明 |
| `/api/clickbait` | 檢測點擊誘餌 |

### 💹 市場端點

| 端點 | 描述 |
|----------|-------------|
| `/api/fear-greed` | 恐懼與貪婪指數及歷史數據 |
| `/api/arbitrage` | 跨交易所套利機會 |
| `/api/signals` | 技術交易信號 |
| `/api/funding` | 衍生品交易所資金費率 |
| `/api/options` | 期權流和最大痛點 |
| `/api/liquidations` | 即時清算數據 |
| `/api/whale-alerts` | 追蹤巨鯨交易 |
| `/api/orderbook` | 聚合訂單簿數據 |

---

## 快速開始

### 使用 cURL

```bash
# 獲取最新新聞
curl "https://cryptocurrency.cv/api/news"

# 搜尋新聞
curl "https://cryptocurrency.cv/api/search?q=ethereum"

# 獲取 AI 摘要
curl "https://cryptocurrency.cv/api/digest"

# 獲取恐懼與貪婪指數
curl "https://cryptocurrency.cv/api/fear-greed"
```

### 使用 JavaScript

```javascript
// 獲取最新新聞
const response = await fetch('https://cryptocurrency.cv/api/news');
const data = await response.json();

console.log(data.articles);
// [{ title, link, source, pubDate, timeAgo, ... }, ...]
```

### 使用 Python

```python
import requests

# 獲取最新新聞
response = requests.get('https://cryptocurrency.cv/api/news')
data = response.json()

for article in data['articles'][:5]:
    print(f"• {article['title']} ({article['source']})")
```

---

## 自託管

### 一鍵部署

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)
[![使用 Railway 部署](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/nirholas/free-crypto-news)

### 本地安裝

```bash
# 克隆倉庫
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# 安裝依賴
npm install

# 運行開發伺服器
npm run dev

# 打開 http://localhost:3000
```

### 環境變數

```env
# 可選：用於 AI 功能（從 groq.com 免費獲取）
GROQ_API_KEY=gsk_your_key_here

# 可選：分析
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

---

## 文檔

| 文檔 | 描述 |
|---|---|
| [📚 API 參考](docs/API.md) | 完整端點文檔 |
| [🏗️ 架構](docs/ARCHITECTURE.md) | 系統設計 |
| [🚀 部署](docs/DEPLOYMENT.md) | 生產指南 |
| [🧪 測試](docs/TESTING.md) | 測試指南 |
| [🔐 安全](docs/SECURITY.md) | 安全政策 |
| [📖 用戶指南](docs/USER-GUIDE.md) | PWA 和功能指南 |
| [💻 開發者指南](docs/DEVELOPER-GUIDE.md) | 貢獻者文檔 |

---

## 貢獻

歡迎貢獻！請參閱 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

```bash
# Fork 倉庫
# 創建功能分支
git checkout -b feature/amazing-feature

# 提交更改
git commit -m 'Add amazing feature'

# 推送並創建 Pull Request
git push origin feature/amazing-feature
```

---

## 授權

MIT License - 請參閱 [LICENSE](LICENSE) 文件。

---

## 聯繫

- 🐛 **Bugs**: [GitHub Issues](https://github.com/nirholas/free-crypto-news/issues)
- 💬 **討論**: [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐦 **Twitter**: [@nirholas](https://twitter.com/nirholas)

---

<p align="center">
  用 ❤️ 為加密貨幣社群打造
  <br>
  <a href="https://cryptocurrency.cv">cryptocurrency.cv</a>
</p>

