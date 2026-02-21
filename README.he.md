🌐 **שפות:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [עברית](README.he.md)

---

<div dir="rtl">

# 🆓 API חדשות קריפטו חינמי

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="רישיון"></a>
</p>

> ⭐ **אם זה שימושי עבורך, אנא תן כוכב לריפו!** זה עוזר לאחרים לגלות את הפרויקט הזה.

---

קבלו חדשות קריפטו בזמן אמת מ-**200+ מקורות** עם קריאת API אחת.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ תכונות

- 🆓 **חינם לתמיד** - ללא מפתח API, ללא הרשמה
- 📰 **200+ מקורות** - 130+ באנגלית + 75 בינלאומיים
- 🌍 **18 שפות** - עם תרגום אוטומטי לאנגלית
- 🤖 **ניתוח AI** - סנטימנט, סיכומים, ואותות מסחר
- 📈 **נתוני שוק** - Fear & Greed Index, מחירי מטבעות
- 🔔 **זמן אמת** - SSE streaming ותמיכת WebSocket
- 🔌 **אינטגרציה קלה** - MCP, ChatGPT, Claude

---

## 🚀 התחלה מהירה

### קבלת חדשות

```bash
# חדשות אחרונות
curl "https://cryptocurrency.cv/api/news?limit=10"

# חדשות ביטקוין
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# חדשות חמות
curl "https://cryptocurrency.cv/api/breaking"
```

### דוגמת Python

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# קבל חדשות אחרונות
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# ניתוח סנטימנט ביטקוין
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC סנטימנט: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"שוק: {fg['classification']} ({fg['value']}/100)")
```

### דוגמת JavaScript

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// קבל חדשות אחרונות
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// סיכום AI
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 נקודות קצה API

### נקודות קצה עיקריות

| נקודת קצה | תיאור |
|-----------|-------|
| `/api/news` | חדשות קריפטו אחרונות |
| `/api/breaking` | חדשות חמות |
| `/api/trending` | מאמרים פופולריים |
| `/api/search?q=` | חיפוש חדשות |

### נקודות קצה AI

| נקודת קצה | תיאור |
|-----------|-------|
| `/api/ai/sentiment` | סנטימנט שוק |
| `/api/summarize` | סיכום חדשות |
| `/api/ask?q=` | שאל שאלות |
| `/api/digest` | דייג'סט יומי |

### נתוני שוק

| נקודת קצה | תיאור |
|-----------|-------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | מחירי מטבעות |
| `/api/market/trending` | מטבעות פופולריים |

---

## 🌍 מקורות בינלאומיים

קבלו חדשות ב-18 שפות:

```bash
# חדשות בעברית (אם זמינות)
curl "https://cryptocurrency.cv/api/news/international?language=he"

# עם תרגום לאנגלית
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 אפליקציית מובייל

אפליקציית React Native נמצאת בתיקייה [mobile/](mobile/):

```bash
cd mobile
npm install
npm start
```

---

## 🔗 קישורים

- **API**: https://cryptocurrency.cv
- **תיעוד**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 רישיון

MIT License - ראו [LICENSE](LICENSE) לפרטים.

---

<p align="center">
  נוצר עם ❤️ עבור קהילת הקריפטו
</p>

</div>

