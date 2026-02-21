🌐 **Sprog:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [Dansk](README.da.md) | [Svenska](README.sv.md) | [Norsk](README.no.md)

---

# 🆓 Gratis Crypto Nyheder API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stjerner"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licens"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Hvis dette er nyttigt, giv venligst repoen en stjerne!** Det hjælper andre med at opdage dette projekt.

---

Få realtids crypto nyheder fra **200+ kilder** med ét API-kald.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | Andre    |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Pris**          | 🆓 Gratis for evigt             | $29-299/md   | Betalt   |
| **API Nøgle**     | ❌ Ikke nødvendig               | Påkrævet     | Påkrævet |
| **Rate Limit**    | Ubegrænset*                     | 100-1000/dag | Begrænset|
| **Kilder**        | 130+ Engelsk + 75 Internationale| 1            | Varierer |
| **International** | 🌏 KO, ZH, JA, ES + oversættelse| Nej          | Nej      |
| **Self-host**     | ✅ Et klik                      | Nej          | Nej      |
| **PWA**           | ✅ Installerbar                 | Nej          | Nej      |
| **MCP**           | ✅ Claude + ChatGPT             | Nej          | Nej      |

---

## 🌍 Internationale Nyhedskilder

Få crypto nyheder fra **75 internationale kilder** på 18 sprog — med automatisk engelsk oversættelse!

| Sprog          | Antal | Eksempel Kilder                                  |
| -------------- | ----- | ----------------------------------------------- |
| 🇨🇳 Kinesisk   | 10    | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 Koreansk   | 9     | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 Japansk    | 6     | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 Portugisisk| 5     | Cointelegraph Brasil, Livecoins                 |
| 🇪🇸 Spansk     | 5     | Cointelegraph Español, Diario Bitcoin           |

### Hurtige Eksempler

```bash
# Hent seneste nyheder
curl "https://cryptocurrency.cv/api/news?limit=10"

# Hent Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Søg artikler
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Progressiv Web App (PWA)

Free Crypto News er en **fuldt installerbar PWA** der virker offline!

| Funktion                | Beskrivelse                             |
| ----------------------- | --------------------------------------- |
| 📲 **Installerbar**     | Tilføj til startskærm på enhver enhed   |
| 📴 **Offline Tilstand** | Læs cached nyheder uden internet        |
| 🔔 **Push Notifikationer** | Få breaking news alarmer             |
| ⚡ **Lynhurtig**        | Aggressive caching strategier           |

---

## 🔌 API Endpoints

| Endpoint                        | Beskrivelse                            |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | Seneste fra alle kilder                |
| `/api/search?q=bitcoin`         | Søg efter nøgleord                     |
| `/api/bitcoin`                  | Bitcoin-specifikke nyheder             |
| `/api/breaking`                 | Kun sidste 2 timer                     |
| `/api/trending`                 | Trending emner med sentiment           |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment analyse                   |
| `/api/ai/digest`                | AI-genereret digest                    |
| `/api/market/fear-greed`        | Frygt & Grådighed Indeks               |
| `/api/whales`                   | Hval alarmer                           |
| `/api/trading/signals`          | Handelssignaler                        |

---

## 🤖 AI Funktioner

Alle AI funktioner er **GRATIS** via Groq:

| Endpoint             | Beskrivelse                            |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | Dyb sentiment analyse                  |
| `/api/ai/summarize`  | AI resuméer                            |
| `/api/ai/ask`        | Stil spørgsmål om crypto               |
| `/api/ai/digest`     | Daglig digest                          |
| `/api/ai/narratives` | Markeds narrativ tracking              |
| `/api/ai/factcheck`  | Fakta tjek                             |

---

## 📦 SDKs & Eksempler

| Sprog      | Pakke                           |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 Hurtig Start

### Med Vercel (Anbefalet)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Lokalt

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 Bidrag

Bidrag er velkomne! Se [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Licens

MIT © [nirholas](https://github.com/nirholas)

