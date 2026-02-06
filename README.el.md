🌐 **Γλώσσες:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Ελληνικά](README.el.md)

---

# 🆓 Δωρεάν Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Άδεια"></a>
</p>

> ⭐ **Αν το βρίσκετε χρήσιμο, βάλτε αστέρι στο repo!** Βοηθάει άλλους να ανακαλύψουν αυτό το project.

---

Λάβετε ειδήσεις crypto σε πραγματικό χρόνο από **200+ πηγές** με μία κλήση API.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Χαρακτηριστικά

- 🆓 **Δωρεάν για πάντα** - Χωρίς κλειδί API, χωρίς εγγραφή
- 📰 **200+ πηγές** - 130+ αγγλικές + 75 διεθνείς πηγές
- 🌍 **18 γλώσσες** - Με αυτόματη αγγλική μετάφραση
- 🤖 **AI Ανάλυση** - Sentiment, περιλήψεις, και σήματα trading
- 📈 **Δεδομένα αγοράς** - Fear & Greed Index, τιμές νομισμάτων
- 🔔 **Πραγματικός χρόνος** - SSE streaming και υποστήριξη WebSocket
- 🔌 **Εύκολη ενσωμάτωση** - MCP, ChatGPT, Claude

---

## 🚀 Γρήγορη Εκκίνηση

### Λήψη ειδήσεων

```bash
# Τελευταίες ειδήσεις
curl "https://cryptocurrency.cv/api/news?limit=10"

# Ειδήσεις Bitcoin
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Παράδειγμα Python

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Λήψη τελευταίων ειδήσεων
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Ανάλυση sentiment Bitcoin
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Sentiment: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Αγορά: {fg['classification']} ({fg['value']}/100)")
```

### Παράδειγμα JavaScript

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Λήψη τελευταίων ειδήσεων
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// AI περίληψη
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 API Endpoints

### Κύρια Endpoints

| Endpoint | Περιγραφή |
|----------|-----------|
| `/api/news` | Τελευταίες ειδήσεις crypto |
| `/api/breaking` | Breaking news |
| `/api/trending` | Trending άρθρα |
| `/api/search?q=` | Αναζήτηση ειδήσεων |

### AI Endpoints

| Endpoint | Περιγραφή |
|----------|-----------|
| `/api/ai/sentiment` | Sentiment αγοράς |
| `/api/summarize` | Περίληψη ειδήσεων |
| `/api/ask?q=` | Υποβολή ερωτήσεων |
| `/api/digest` | Ημερήσιο digest |

### Δεδομένα Αγοράς

| Endpoint | Περιγραφή |
|----------|-----------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Τιμές νομισμάτων |
| `/api/market/trending` | Trending νομίσματα |

---

## 🌍 Διεθνείς Πηγές

Λάβετε ειδήσεις σε 18 γλώσσες:

```bash
# Ελληνικές ειδήσεις (αν υπάρχουν)
curl "https://cryptocurrency.cv/api/news/international?language=el"

# Με αγγλική μετάφραση
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Mobile App

Η React Native mobile app βρίσκεται στον φάκελο [mobile/](mobile/):

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Σύνδεσμοι

- **API**: https://cryptocurrency.cv
- **Τεκμηρίωση**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Άδεια

MIT License - δείτε [LICENSE](LICENSE) για λεπτομέρειες.

---

<p align="center">
  Φτιαγμένο με ❤️ για την κοινότητα crypto
</p>
