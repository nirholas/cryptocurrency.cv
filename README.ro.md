🌐 **Limbi:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Română](README.ro.md)

---

# 🆓 API Gratuit pentru Știri Crypto

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licență"></a>
</p>

> ⭐ **Dacă găsești util, oferă o stea repo-ului!** Ajută pe alții să descopere acest proiect.

---

Obține știri crypto în timp real din **200+ surse** cu un singur apel API.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Caracteristici

- 🆓 **Gratuit pentru totdeauna** - Fără cheie API, fără înregistrare
- 📰 **200+ surse** - 130+ în engleză + 75 internaționale
- 🌍 **18 limbi** - Cu traducere automată în engleză
- 🤖 **Analiză AI** - Sentiment, rezumate și semnale de tranzacționare
- 📈 **Date de piață** - Fear & Greed Index, prețuri monede
- 🔔 **Timp real** - SSE streaming și suport WebSocket
- 🔌 **Integrare ușoară** - MCP, ChatGPT, Claude

---

## 🚀 Start Rapid

### Obține știri

```bash
# Ultimele știri
curl "https://cryptocurrency.cv/api/news?limit=10"

# Știri Bitcoin
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Exemplu Python

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Obține ultimele știri
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Analiză sentiment Bitcoin
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Sentiment: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Piață: {fg['classification']} ({fg['value']}/100)")
```

### Exemplu JavaScript

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Obține ultimele știri
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// Rezumat AI
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 Endpoint-uri API

### Endpoint-uri Principale

| Endpoint | Descriere |
|----------|-----------|
| `/api/news` | Ultimele știri crypto |
| `/api/breaking` | Breaking news |
| `/api/trending` | Articole populare |
| `/api/search?q=` | Căutare știri |

### Endpoint-uri AI

| Endpoint | Descriere |
|----------|-----------|
| `/api/ai/sentiment` | Sentiment piață |
| `/api/summarize` | Rezumat știri |
| `/api/ask?q=` | Pune întrebări |
| `/api/digest` | Digest zilnic |

### Date de Piață

| Endpoint | Descriere |
|----------|-----------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Prețuri monede |
| `/api/market/trending` | Monede populare |

---

## 🌍 Surse Internaționale

Obține știri în 18 limbi:

```bash
# Știri românești (dacă sunt disponibile)
curl "https://cryptocurrency.cv/api/news/international?language=ro"

# Cu traducere în engleză
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Aplicație Mobilă

Aplicația mobilă React Native se află în directorul [mobile/](mobile/):

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Linkuri

- **API**: https://cryptocurrency.cv
- **Documentație**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Licență

MIT License - vezi [LICENSE](LICENSE) pentru detalii.

---

<p align="center">
  Creat cu ❤️ pentru comunitatea crypto
</p>

