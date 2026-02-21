🌐 **ভাষা:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [বাংলা](README.bn.md)

---

# 🆓 বিনামূল্যে ক্রিপ্টো নিউজ API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="লাইসেন্স"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI স্ট্যাটাস"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API ডেমো" width="700">
</p>

> ⭐ **এটি আপনার কাজে লাগলে, অনুগ্রহ করে রেপোতে স্টার দিন!** এটি অন্যদের এই প্রজেক্ট আবিষ্কার করতে সাহায্য করে।

---

একটি API কল দিয়ে **200+ উৎস** থেকে রিয়েল-টাইম ক্রিপ্টো নিউজ পান।

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | অন্যান্য  |
| ----------------- | ------------------------------- | ------------ | -------- |
| **মূল্য**          | 🆓 চিরকাল বিনামূল্যে            | $29-299/মাস  | পেইড     |
| **API কী**        | ❌ প্রয়োজন নেই                  | প্রয়োজন      | প্রয়োজন  |
| **রেট লিমিট**     | সীমাহীন*                        | 100-1000/দিন | সীমিত    |
| **উৎস**           | 130+ ইংরেজি + 75 আন্তর্জাতিক    | 1            | পরিবর্তনশীল |
| **আন্তর্জাতিক**   | 🌏 KO, ZH, JA, ES + অনুবাদ      | না           | না       |
| **সেলফ-হোস্ট**    | ✅ এক ক্লিকে                    | না           | না       |
| **PWA**           | ✅ ইনস্টলযোগ্য                  | না           | না       |
| **MCP**           | ✅ Claude + ChatGPT             | না           | না       |

---

## 🌍 আন্তর্জাতিক নিউজ উৎস

18টি ভাষায় **75টি আন্তর্জাতিক উৎস** থেকে ক্রিপ্টো নিউজ পান — স্বয়ংক্রিয় ইংরেজি অনুবাদ সহ!

| ভাষা           | সংখ্যা | উদাহরণ উৎস                                       |
| -------------- | ------ | ----------------------------------------------- |
| 🇨🇳 চীনা       | 10     | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 কোরিয়ান   | 9      | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 জাপানি    | 6      | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 পর্তুগিজ   | 5      | Cointelegraph Brasil, Livecoins                 |
| 🇮🇳 হিন্দি     | 5      | CoinSwitch, CoinDCX, WazirX, ZebPay             |

### দ্রুত উদাহরণ

```bash
# সাম্প্রতিক নিউজ পান
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin সেন্টিমেন্ট পান
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# আর্টিকেল অনুসন্ধান
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 প্রোগ্রেসিভ ওয়েব অ্যাপ (PWA)

Free Crypto News একটি **সম্পূর্ণ ইনস্টলযোগ্য PWA** যা অফলাইনে কাজ করে!

| ফিচার                   | বিবরণ                                  |
| ----------------------- | -------------------------------------- |
| 📲 **ইনস্টলযোগ্য**       | যেকোনো ডিভাইসে হোম স্ক্রিনে যোগ করুন    |
| 📴 **অফলাইন মোড**        | ইন্টারনেট ছাড়া ক্যাশড নিউজ পড়ুন       |
| 🔔 **পুশ নোটিফিকেশন**    | ব্রেকিং নিউজ অ্যালার্ট পান              |
| ⚡ **বিদ্যুৎ গতি**        | আক্রমণাত্মক ক্যাশিং কৌশল               |

---

## 🔌 API এন্ডপয়েন্ট

| এন্ডপয়েন্ট                      | বিবরণ                              |
| ------------------------------- | ---------------------------------- |
| `/api/news`                     | সব উৎস থেকে সাম্প্রতিক              |
| `/api/search?q=bitcoin`         | কীওয়ার্ড দিয়ে অনুসন্ধান            |
| `/api/bitcoin`                  | Bitcoin-নির্দিষ্ট নিউজ             |
| `/api/breaking`                 | শুধুমাত্র শেষ 2 ঘন্টা               |
| `/api/trending`                 | সেন্টিমেন্ট সহ ট্রেন্ডিং টপিক       |
| `/api/ai/sentiment?asset=BTC`   | AI সেন্টিমেন্ট বিশ্লেষণ             |
| `/api/ai/digest`                | AI-জেনারেটেড ডাইজেস্ট               |
| `/api/market/fear-greed`        | ভয় ও লোভ সূচক                      |
| `/api/whales`                   | তিমি সতর্কতা                       |
| `/api/trading/signals`          | ট্রেডিং সিগন্যাল                   |

---

## 🤖 AI ফিচার

সব AI ফিচার Groq এর মাধ্যমে **বিনামূল্যে**:

| এন্ডপয়েন্ট          | বিবরণ                              |
| -------------------- | ---------------------------------- |
| `/api/ai/sentiment`  | গভীর সেন্টিমেন্ট বিশ্লেষণ           |
| `/api/ai/summarize`  | AI সারাংশ                          |
| `/api/ai/ask`        | ক্রিপ্টো সম্পর্কে প্রশ্ন করুন       |
| `/api/ai/digest`     | দৈনিক ডাইজেস্ট                     |
| `/api/ai/narratives` | মার্কেট ন্যারেটিভ ট্র্যাকিং         |
| `/api/ai/factcheck`  | ফ্যাক্ট চেকিং                      |

---

## 📦 SDKs ও উদাহরণ

| ভাষা       | প্যাকেজ                         |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 দ্রুত শুরু

### Vercel দিয়ে (প্রস্তাবিত)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### স্থানীয়ভাবে

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 অবদান

অবদান স্বাগত! দেখুন [CONTRIBUTING.md](CONTRIBUTING.md)।

---

## 📄 লাইসেন্স

MIT © [nirholas](https://github.com/nirholas)

