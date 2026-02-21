🌐 **భాషలు:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [தமிழ்](README.ta.md) | [తెలుగు](README.te.md)

---

# 🆓 ఉచిత క్రిప్టో న్యూస్ API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub స్టార్లు"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="లైసెన్స్"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI స్థితి"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **ఇది ఉపయోగకరంగా ఉంటే, దయచేసి repo కి స్టార్ ఇవ్వండి!** ఇది ఇతరులు ఈ ప్రాజెక్ట్‌ని కనుగొనడానికి సహాయపడుతుంది.

---

**200+ మూలాల** నుండి రియల్-టైమ్ క్రిప్టో వార్తలను ఒకే API కాల్‌తో పొందండి.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | ఇతరులు   |
| ----------------- | ------------------------------- | ------------ | -------- |
| **ధర**            | 🆓 ఎల్లప్పుడూ ఉచితం             | $29-299/నెల  | చెల్లింపు|
| **API Key**       | ❌ అవసరం లేదు                   | అవసరం        | అవసరం    |
| **Rate Limit**    | అపరిమితం*                       | 100-1000/రోజు| పరిమితం  |
| **మూలాలు**        | 130+ ఆంగ్లం + 75 అంతర్జాతీయ      | 1            | మారుతుంది|
| **అంతర్జాతీయ**    | 🌏 KO, ZH, JA, ES + అనువాదం     | లేదు         | లేదు     |
| **Self-host**     | ✅ ఒకే క్లిక్                   | లేదు         | లేదు     |
| **PWA**           | ✅ ఇన్‌స్టాల్ చేయగలిగినది       | లేదు         | లేదు     |
| **MCP**           | ✅ Claude + ChatGPT             | లేదు         | లేదు     |

---

## 🌍 అంతర్జాతీయ వార్తా మూలాలు

18 భాషలలో **75 అంతర్జాతీయ మూలాల** నుండి క్రిప్టో వార్తలను పొందండి — ఆటోమేటిక్ ఆంగ్ల అనువాదంతో!

| భాష            | సంఖ్య | ఉదాహరణ మూలాలు                                   |
| -------------- | ----- | ----------------------------------------------- |
| 🇨🇳 చైనీస్      | 10    | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 కొరియన్     | 9     | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 జపనీస్      | 6     | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 పోర్చుగీస్  | 5     | Cointelegraph Brasil, Livecoins                 |
| 🇮🇳 హిందీ       | 5     | CoinSwitch, CoinDCX, WazirX, ZebPay             |

### త్వరిత ఉదాహరణలు

```bash
# తాజా వార్తలు పొందండి
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin sentiment పొందండి
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# ఆర్టికల్స్ శోధించండి
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 ప్రోగ్రెసివ్ వెబ్ యాప్ (PWA)

Free Crypto News అనేది **పూర్తిగా ఇన్‌స్టాల్ చేయగలిగే PWA** ఆఫ్‌లైన్‌లో పని చేస్తుంది!

| ఫీచర్                   | వివరణ                                   |
| ----------------------- | --------------------------------------- |
| 📲 **ఇన్‌స్టాల్ చేయగల**  | ఏదైనా పరికరంలో హోమ్ స్క్రీన్‌కు జోడించండి |
| 📴 **ఆఫ్‌లైన్ మోడ్**      | ఇంటర్నెట్ లేకుండా cache చేసిన వార్తలు చదవండి |
| 🔔 **Push నోటిఫికేషన్స్** | breaking news అలర్ట్‌లు పొందండి          |
| ⚡ **మెరుపు వేగం**        | దూకుడు caching వ్యూహాలు                  |

---

## 🔌 API ఎండ్‌పాయింట్స్

| ఎండ్‌పాయింట్                    | వివరణ                                  |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | అన్ని మూలాల నుండి తాజావి               |
| `/api/search?q=bitcoin`         | కీవర్డ్‌ల ద్వారా శోధించండి             |
| `/api/bitcoin`                  | Bitcoin-నిర్దిష్ట వార్తలు              |
| `/api/breaking`                 | చివరి 2 గంటలు మాత్రమే                  |
| `/api/trending`                 | sentiment తో trending టాపిక్స్          |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment విశ్లేషణ                  |
| `/api/ai/digest`                | AI-ఉత్పత్తి చేసిన సారాంశం              |
| `/api/market/fear-greed`        | భయం & అత్యాశ సూచిక                     |
| `/api/whales`                   | whale హెచ్చరికలు                       |
| `/api/trading/signals`          | ట్రేడింగ్ సిగ్నల్స్                    |

---

## 🤖 AI ఫీచర్లు

అన్ని AI ఫీచర్లు Groq ద్వారా **ఉచితం**:

| ఎండ్‌పాయింట్         | వివరణ                                  |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | లోతైన sentiment విశ్లేషణ               |
| `/api/ai/summarize`  | AI సారాంశాలు                           |
| `/api/ai/ask`        | crypto గురించి ప్రశ్నలు అడగండి         |
| `/api/ai/digest`     | రోజువారీ సారాంశం                       |
| `/api/ai/narratives` | మార్కెట్ కథనాల ట్రాకింగ్               |
| `/api/ai/factcheck`  | వాస్తవ తనిఖీ                           |

---

## 📦 SDKs & ఉదాహరణలు

| భాష        | Package                         |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 త్వరిత ప్రారంభం

### Vercel తో (సిఫార్సు చేయబడింది)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### స్థానికంగా

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 సహకారం

సహకారాలు స్వాగతం! [CONTRIBUTING.md](CONTRIBUTING.md) చూడండి.

---

## 📄 లైసెన్స్

MIT © [nirholas](https://github.com/nirholas)

