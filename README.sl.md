🌐 **Jeziki:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [Hrvatski](README.hr.md) | [Slovenščina](README.sl.md) | [Srpski](README.sr.md)

---

# 🆓 Brezplačni Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Zvezdice"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licenca"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Če vam je to koristno, prosimo dajte repozitoriju zvezdico!** To pomaga drugim odkriti ta projekt.

---

Pridobite crypto novice v realnem času iz **200+ virov** z enim API klicem.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | Drugi    |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Cena**          | 🆓 Za vedno brezplačno          | $29-299/mes  | Plačljivo|
| **API Ključ**     | ❌ Ni potreben                  | Obvezen      | Obvezen  |
| **Rate Limit**    | Neomejeno*                      | 100-1000/dan | Omejeno  |
| **Viri**          | 130+ Angleških + 75 Mednarodnih | 1            | Razlikuje|
| **Mednarodno**    | 🌏 KO, ZH, JA, ES + prevod      | Ne           | Ne       |
| **Self-host**     | ✅ En klik                      | Ne           | Ne       |
| **PWA**           | ✅ Namestljivo                  | Ne           | Ne       |
| **MCP**           | ✅ Claude + ChatGPT             | Ne           | Ne       |

---

## 🌍 Mednarodni Viri Novic

Pridobite crypto novice iz **75 mednarodnih virov** v 18 jezikih — z avtomatskim prevodom v angleščino!

| Jezik          | Število | Primeri Virov                                   |
| -------------- | ------- | ----------------------------------------------- |
| 🇨🇳 Kitajski   | 10      | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 Korejski   | 9       | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 Japonski   | 6       | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 Portugalski| 5       | Cointelegraph Brasil, Livecoins                 |
| 🇪🇸 Španski    | 5       | Cointelegraph Español, Diario Bitcoin           |

### Hitri Primeri

```bash
# Pridobite najnovejše novice
curl "https://cryptocurrency.cv/api/news?limit=10"

# Pridobite Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Iščite članke
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Progresivna Spletna Aplikacija (PWA)

Free Crypto News je **popolnoma namestljiva PWA** ki deluje brez povezave!

| Funkcija                | Opis                                    |
| ----------------------- | --------------------------------------- |
| 📲 **Namestljivo**      | Dodajte na domači zaslon na katerikoli napravi |
| 📴 **Brez Povezave**    | Berite predpomnjene novice brez interneta |
| 🔔 **Push Obvestila**   | Prejemajte alarme za breaking novice    |
| ⚡ **Bliskovito Hitro** | Agresivne strategije predpomnjenja      |

---

## 🔌 API Končne Točke

| Končna Točka                    | Opis                                   |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | Najnovejše iz vseh virov               |
| `/api/search?q=bitcoin`         | Iskanje po ključnih besedah            |
| `/api/bitcoin`                  | Bitcoin-specifične novice              |
| `/api/breaking`                 | Samo zadnji 2 uri                      |
| `/api/trending`                 | Trending teme s sentimentom            |
| `/api/ai/sentiment?asset=BTC`   | AI analiza sentimenta                  |
| `/api/ai/digest`                | AI-generiran povzetek                  |
| `/api/market/fear-greed`        | Indeks Strahu in Pohlepa               |
| `/api/whales`                   | Opozorila o kitih                      |
| `/api/trading/signals`          | Trgovalni signali                      |

---

## 🤖 AI Funkcije

Vse AI funkcije so **BREZPLAČNE** prek Groq:

| Končna Točka         | Opis                                   |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | Globoka analiza sentimenta             |
| `/api/ai/summarize`  | AI povzetki                            |
| `/api/ai/ask`        | Zastavite vprašanja o cryptu           |
| `/api/ai/digest`     | Dnevni povzetek                        |
| `/api/ai/narratives` | Sledenje tržnim narativom              |
| `/api/ai/factcheck`  | Preverjanje dejstev                    |

---

## 📦 SDK-ji in Primeri

| Jezik      | Paket                           |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 Hiter Začetek

### Z Vercel (Priporočeno)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Lokalno

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 Prispevki

Prispevki so dobrodošli! Poglejte [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Licenca

MIT © [nirholas](https://github.com/nirholas)
