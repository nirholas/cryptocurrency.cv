🌐 **Språk:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Svenska](README.sv.md)

---

# 🆓 Gratis Krypto Nyheter API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licens"></a>
</p>

> ⭐ **Om du tycker detta är användbart, stjärnmärk repot!** Det hjälper andra att upptäcka detta projekt.

---

Få realtids kryptonyheter från **200+ källor** med ett API-anrop.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Funktioner

- 🆓 **Gratis för alltid** - Ingen API-nyckel, ingen registrering
- 📰 **200+ källor** - 130+ engelska + 75 internationella källor
- 🌍 **18 språk** - Med automatisk engelsk översättning
- 🤖 **AI-analys** - Sentiment, sammanfattningar och handelssignaler
- 📈 **Marknadsdata** - Fear & Greed Index, myntpriser
- 🔔 **Realtid** - SSE-streaming och WebSocket-stöd
- 🔌 **Enkel integration** - MCP, ChatGPT, Claude

---

## 🚀 Snabbstart

### Hämta nyheter

```bash
# Senaste nyheterna
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin-nyheter
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Python-exempel

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Hämta senaste nyheterna
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Bitcoin sentimentanalys
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Sentiment: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Marknad: {fg['classification']} ({fg['value']}/100)")
```

### JavaScript-exempel

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Hämta senaste nyheterna
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// AI-sammanfattning
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 API-endpoints

### Huvudendpoints

| Endpoint | Beskrivning |
|----------|-------------|
| `/api/news` | Senaste kryptonyheter |
| `/api/breaking` | Breaking news |
| `/api/trending` | Trendande artiklar |
| `/api/search?q=` | Sök nyheter |

### AI-endpoints

| Endpoint | Beskrivning |
|----------|-------------|
| `/api/ai/sentiment` | Marknadssentiment |
| `/api/summarize` | Nyhetssammanfattning |
| `/api/ask?q=` | Ställ frågor |
| `/api/digest` | Daglig digest |

### Marknadsdata

| Endpoint | Beskrivning |
|----------|-------------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Myntpriser |
| `/api/market/trending` | Trendande mynt |

---

## 🌍 Internationella källor

Hämta nyheter på 18 språk:

```bash
# Svenska nyheter (om tillgängliga)
curl "https://cryptocurrency.cv/api/news/international?language=sv"

# Med engelsk översättning
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Mobilapp

React Native-mobilapp finns i [mobile/](mobile/)-mappen:

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Länkar

- **API**: https://cryptocurrency.cv
- **Dokumentation**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Licens

MIT-licens - se [LICENSE](LICENSE) för detaljer.

---

<p align="center">
  Gjord med ❤️ för kryptgemenskapen
</p>
