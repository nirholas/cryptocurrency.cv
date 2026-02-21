🌐 **Språk:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [Dansk](README.da.md) | [Svenska](README.sv.md) | [Norsk](README.no.md) | [Suomi](README.fi.md)

---

# 🆓 Gratis Crypto Nyheter API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stjerner"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lisens"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Hvis dette er nyttig, gi gjerne repoet en stjerne!** Det hjelper andre å oppdage dette prosjektet.

---

Få sanntids crypto nyheter fra **200+ kilder** med ett API-kall.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | Andre    |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Pris**          | 🆓 Gratis for alltid            | $29-299/md   | Betalt   |
| **API Nøkkel**    | ❌ Ikke nødvendig               | Påkrevd      | Påkrevd  |
| **Rate Limit**    | Ubegrenset*                     | 100-1000/dag | Begrenset|
| **Kilder**        | 130+ Engelsk + 75 Internasjonale| 1            | Varierer |
| **Internasjonal** | 🌏 KO, ZH, JA, ES + oversettelse| Nei          | Nei      |
| **Self-host**     | ✅ Ett klikk                    | Nei          | Nei      |
| **PWA**           | ✅ Installerbar                 | Nei          | Nei      |
| **MCP**           | ✅ Claude + ChatGPT             | Nei          | Nei      |

---

## 🌍 Internasjonale Nyhetskilder

Få crypto nyheter fra **75 internasjonale kilder** på 18 språk — med automatisk engelsk oversettelse!

| Språk          | Antall | Eksempel Kilder                                 |
| -------------- | ------ | ----------------------------------------------- |
| 🇨🇳 Kinesisk   | 10     | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 Koreansk   | 9      | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 Japansk    | 6      | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 Portugisisk| 5      | Cointelegraph Brasil, Livecoins                 |
| 🇪🇸 Spansk     | 5      | Cointelegraph Español, Diario Bitcoin           |

### Raske Eksempler

```bash
# Hent siste nyheter
curl "https://cryptocurrency.cv/api/news?limit=10"

# Hent Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Søk artikler
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Progressiv Web App (PWA)

Free Crypto News er en **fullt installerbar PWA** som fungerer offline!

| Funksjon                | Beskrivelse                             |
| ----------------------- | --------------------------------------- |
| 📲 **Installerbar**     | Legg til på hjemskjerm på enhver enhet  |
| 📴 **Offline Modus**    | Les cached nyheter uten internett       |
| 🔔 **Push Varsler**     | Få breaking news alarmer                |
| ⚡ **Lynrask**          | Aggressive caching strategier           |

---

## 🔌 API Endepunkter

| Endepunkt                       | Beskrivelse                            |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | Siste fra alle kilder                  |
| `/api/search?q=bitcoin`         | Søk etter nøkkelord                    |
| `/api/bitcoin`                  | Bitcoin-spesifikke nyheter             |
| `/api/breaking`                 | Kun siste 2 timer                      |
| `/api/trending`                 | Trending emner med sentiment           |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment analyse                   |
| `/api/ai/digest`                | AI-generert digest                     |
| `/api/market/fear-greed`        | Frykt & Grådighet Indeks               |
| `/api/whales`                   | Hval alarmer                           |
| `/api/trading/signals`          | Handelssignaler                        |

---

## 🤖 AI Funksjoner

Alle AI funksjoner er **GRATIS** via Groq:

| Endepunkt            | Beskrivelse                            |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | Dyp sentiment analyse                  |
| `/api/ai/summarize`  | AI sammendrag                          |
| `/api/ai/ask`        | Still spørsmål om crypto               |
| `/api/ai/digest`     | Daglig digest                          |
| `/api/ai/narratives` | Markeds narrativ sporing               |
| `/api/ai/factcheck`  | Faktasjekk                             |

---

## 📦 SDKer & Eksempler

| Språk      | Pakke                           |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 Rask Start

### Med Vercel (Anbefalt)

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

## 📄 Lisens

MIT © [nirholas](https://github.com/nirholas)

