🌐 **Мови:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Українська](README.uk.md)

---

# 🆓 Безкоштовний Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Ліцензія"></a>
</p>

> ⭐ **Якщо вам це корисно, поставте зірочку репозиторію!** Це допомагає іншим знайти цей проект.

---

Отримуйте криптоновини в реальному часі з **200+ джерел** одним API-запитом.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Можливості

- 🆓 **Безкоштовно назавжди** - Без API-ключа, без реєстрації
- 📰 **200+ джерел** - 130+ англійських + 75 міжнародних джерел
- 🌍 **18 мов** - З автоматичним англійським перекладом
- 🤖 **AI Аналіз** - Сентимент, підсумки та торгові сигнали
- 📈 **Ринкові дані** - Fear & Greed Index, ціни монет
- 🔔 **Реальний час** - SSE стрімінг та WebSocket підтримка
- 🔌 **Легка інтеграція** - MCP, ChatGPT, Claude

---

## 🚀 Швидкий старт

### Отримання новин

```bash
# Останні новини
curl "https://cryptocurrency.cv/api/news?limit=10"

# Новини Bitcoin
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Приклад Python

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Отримати останні новини
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Аналіз сентименту Bitcoin
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Сентимент: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Ринок: {fg['classification']} ({fg['value']}/100)")
```

### Приклад JavaScript

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Отримати останні новини
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// AI підсумок
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 API Ендпоінти

### Основні ендпоінти

| Ендпоінт | Опис |
|----------|------|
| `/api/news` | Останні криптоновини |
| `/api/breaking` | Breaking news |
| `/api/trending` | Популярні статті |
| `/api/search?q=` | Пошук новин |

### AI Ендпоінти

| Ендпоінт | Опис |
|----------|------|
| `/api/ai/sentiment` | Ринковий сентимент |
| `/api/summarize` | Підсумок новин |
| `/api/ask?q=` | Задати питання |
| `/api/digest` | Щоденний дайджест |

### Ринкові дані

| Ендпоінт | Опис |
|----------|------|
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Ціни монет |
| `/api/market/trending` | Популярні монети |

---

## 🌍 Міжнародні джерела

Отримуйте новини 18 мовами:

```bash
# Українські новини (якщо доступні)
curl "https://cryptocurrency.cv/api/news/international?language=uk"

# З англійським перекладом
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Мобільний додаток

React Native мобільний додаток знаходиться в папці [mobile/](mobile/):

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Посилання

- **API**: https://cryptocurrency.cv
- **Документація**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Ліцензія

MIT License - дивіться [LICENSE](LICENSE) для деталей.

---

<p align="center">
  Зроблено з ❤️ для криптоспільноти
</p>
