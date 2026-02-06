🌐 **Mga Wika:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [Filipino](README.tl.md)

---

# 🆓 Libreng Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lisensya"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Kung ito ay kapaki-pakinabang, mangyaring bigyan ng star ang repo!** Nakakatulong ito sa iba na matuklasan ang proyektong ito.

---

Makakuha ng real-time na crypto news mula sa **200+ mga pinagmulan** sa isang API call.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | Iba pa   |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Presyo**        | 🆓 Libre magpakailanman         | $29-299/buwan| Bayad    |
| **API Key**       | ❌ Hindi kailangan              | Kailangan    | Kailangan|
| **Rate Limit**    | Walang limitasyon*              | 100-1000/araw| Limitado |
| **Mga Pinagmulan**| 130+ Ingles + 75 Internasyonal  | 1            | Nag-iiba |
| **Internasyonal** | 🌏 KO, ZH, JA, ES + pagsasalin  | Hindi        | Hindi    |
| **Self-host**     | ✅ Isang click                  | Hindi        | Hindi    |
| **PWA**           | ✅ Maaaring i-install           | Hindi        | Hindi    |
| **MCP**           | ✅ Claude + ChatGPT             | Hindi        | Hindi    |

---

## 🌍 Mga Internasyonal na Pinagmulan ng Balita

Makakuha ng crypto news mula sa **75 internasyonal na pinagmulan** sa 18 wika — na may automatic na pagsasalin sa Ingles!

| Wika           | Bilang | Mga Halimbawang Pinagmulan                      |
| -------------- | ------ | ----------------------------------------------- |
| 🇨🇳 Intsik     | 10     | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 Koreano    | 9      | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 Hapon      | 6      | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 Portuges   | 5      | Cointelegraph Brasil, Livecoins                 |
| 🇪🇸 Espanyol   | 5      | Cointelegraph Español, Diario Bitcoin           |

### Mga Mabilis na Halimbawa

```bash
# Kunin ang pinakabagong balita
curl "https://cryptocurrency.cv/api/news?limit=10"

# Kunin ang Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Maghanap ng mga artikulo
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Progressive Web App (PWA)

Ang Free Crypto News ay isang **ganap na maaaring i-install na PWA** na gumagana offline!

| Feature                 | Paglalarawan                            |
| ----------------------- | --------------------------------------- |
| 📲 **Maaaring I-install** | Idagdag sa home screen sa anumang device |
| 📴 **Offline Mode**     | Basahin ang cached na balita nang walang internet |
| 🔔 **Push Notifications** | Makakuha ng breaking news alerts       |
| ⚡ **Napakabilis**       | Mga agresibong caching strategy         |

---

## 🔌 Mga API Endpoint

| Endpoint                        | Paglalarawan                           |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | Pinakabago mula sa lahat ng pinagmulan |
| `/api/search?q=bitcoin`         | Maghanap sa pamamagitan ng keyword     |
| `/api/bitcoin`                  | Bitcoin-specific na balita             |
| `/api/breaking`                 | Huling 2 oras lamang                   |
| `/api/trending`                 | Trending na paksa na may sentiment     |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment analysis                  |
| `/api/ai/digest`                | AI-generated na digest                 |
| `/api/market/fear-greed`        | Fear & Greed Index                     |
| `/api/whales`                   | Mga whale alert                        |
| `/api/trading/signals`          | Mga trading signal                     |

---

## 🤖 Mga AI Feature

Lahat ng AI feature ay **LIBRE** sa pamamagitan ng Groq:

| Endpoint             | Paglalarawan                           |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | Malalim na sentiment analysis          |
| `/api/ai/summarize`  | Mga AI summary                         |
| `/api/ai/ask`        | Magtanong tungkol sa crypto            |
| `/api/ai/digest`     | Araw-araw na digest                    |
| `/api/ai/narratives` | Market narrative tracking              |
| `/api/ai/factcheck`  | Fact checking                          |

---

## 📦 Mga SDK at Halimbawa

| Wika       | Package                         |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 Mabilis na Pagsisimula

### Gamit ang Vercel (Inirerekomenda)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Lokal

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 Pagttulong

Ang mga kontribusyon ay malugod na tinatanggap! Tingnan ang [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Lisensya

MIT © [nirholas](https://github.com/nirholas)
