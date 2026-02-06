🌐 **Nyelvek:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Magyar](README.hu.md)

---

# 🆓 Ingyenes Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licenc"></a>
</p>

> ⭐ **Ha hasznosnak találod, adj csillagot a repónak!** Segít másoknak felfedezni ezt a projektet.

---

Kapj valós idejű kripto híreket **200+ forrásból** egyetlen API hívással.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Funkciók

- 🆓 **Örökre ingyenes** - Nincs API kulcs, nincs regisztráció
- 📰 **200+ forrás** - 130+ angol + 75 nemzetközi forrás
- 🌍 **18 nyelv** - Automatikus angol fordítással
- 🤖 **AI Elemzés** - Hangulat, összefoglalók és kereskedési jelek
- 📈 **Piaci adatok** - Fear & Greed Index, érme árak
- 🔔 **Valós idejű** - SSE streaming és WebSocket támogatás
- 🔌 **Egyszerű integráció** - MCP, ChatGPT, Claude

---

## 🚀 Gyors indítás

### Hírek lekérése

```bash
# Legújabb hírek
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin hírek
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Python példa

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Legújabb hírek lekérése
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Bitcoin hangulat elemzés
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Hangulat: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Piac: {fg['classification']} ({fg['value']}/100)")
```

### JavaScript példa

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Legújabb hírek lekérése
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// AI összefoglaló
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 API Végpontok

### Fő végpontok

| Végpont | Leírás |
|---------|--------|
| `/api/news` | Legújabb kripto hírek |
| `/api/breaking` | Breaking news |
| `/api/trending` | Népszerű cikkek |
| `/api/search?q=` | Hírek keresése |

### AI Végpontok

| Végpont | Leírás |
|---------|--------|
| `/api/ai/sentiment` | Piaci hangulat |
| `/api/summarize` | Hírek összefoglalása |
| `/api/ask?q=` | Kérdések feltevése |
| `/api/digest` | Napi összefoglaló |

### Piaci adatok

| Végpont | Leírás |
|---------|--------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Érme árak |
| `/api/market/trending` | Népszerű érmék |

---

## 🌍 Nemzetközi források

Kapj híreket 18 nyelven:

```bash
# Magyar hírek (ha elérhetők)
curl "https://cryptocurrency.cv/api/news/international?language=hu"

# Angol fordítással
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Mobil alkalmazás

A React Native mobil alkalmazás a [mobile/](mobile/) mappában található:

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Linkek

- **API**: https://cryptocurrency.cv
- **Dokumentáció**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Licenc

MIT License - lásd a [LICENSE](LICENSE) fájlt a részletekért.

---

<p align="center">
  ❤️ -vel készült a kripto közösségnek
</p>
