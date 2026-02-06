🌐 **Kielet:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Suomi](README.fi.md)

---

# 🆓 Ilmainen Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lisenssi"></a>
</p>

> ⭐ **Jos pidät tätä hyödyllisenä, anna repolle tähti!** Se auttaa muita löytämään tämän projektin.

---

Saat reaaliaikaisia kryptouutisia **200+ lähteestä** yhdellä API-kutsulla.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ Ominaisuudet

- 🆓 **Ilmainen ikuisesti** - Ei API-avainta, ei rekisteröintiä
- 📰 **200+ lähdettä** - 130+ englanninkielistä + 75 kansainvälistä
- 🌍 **18 kieltä** - Automaattinen englanninkielinen käännös
- 🤖 **AI-analyysi** - Sentimentti, yhteenvedot ja kaupankäyntisignaalit
- 📈 **Markkinadata** - Fear & Greed -indeksi, kolikkojen hinnat
- 🔔 **Reaaliaikainen** - SSE-suoratoisto ja WebSocket-tuki
- 🔌 **Helppo integrointi** - MCP, ChatGPT, Claude

---

## 🚀 Pikakäynnistys

### Hae uutisia

```bash
# Uusimmat uutiset
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin-uutiset
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# Breaking news
curl "https://cryptocurrency.cv/api/breaking"
```

### Python-esimerkki

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Hae uusimmat uutiset
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Bitcoin-sentimenttianalyysi
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC Sentimentti: {sentiment['label']} ({sentiment['score']:.2f})")

# Fear & Greed -indeksi
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Markkinat: {fg['classification']} ({fg['value']}/100)")
```

### JavaScript-esimerkki

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Hae uusimmat uutiset
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// AI-yhteenveto
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 API-päätepisteet

### Pääpäätepisteet

| Päätepiste | Kuvaus |
|------------|--------|
| `/api/news` | Uusimmat kryptouutiset |
| `/api/breaking` | Breaking news |
| `/api/trending` | Suositut artikkelit |
| `/api/search?q=` | Hae uutisia |

### AI-päätepisteet

| Päätepiste | Kuvaus |
|------------|--------|
| `/api/ai/sentiment` | Markkinasentimentti |
| `/api/summarize` | Uutisyhteenveto |
| `/api/ask?q=` | Esitä kysymyksiä |
| `/api/digest` | Päivittäinen tiivistelmä |

### Markkinadata

| Päätepiste | Kuvaus |
|------------|--------|
| `/api/market/fear-greed` | Fear & Greed -indeksi |
| `/api/market/coins` | Kolikkojen hinnat |
| `/api/market/trending` | Suositut kolikot |

---

## 🌍 Kansainväliset lähteet

Saat uutisia 18 kielellä:

```bash
# Suomalaiset uutiset (jos saatavilla)
curl "https://cryptocurrency.cv/api/news/international?language=fi"

# Englanninkielisellä käännöksellä
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

---

## 📱 Mobiilisovellus

React Native -mobiilisovellus löytyy [mobile/](mobile/)-kansiosta:

```bash
cd mobile
npm install
npm start
```

---

## 🔗 Linkit

- **API**: https://cryptocurrency.cv
- **Dokumentaatio**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 Lisenssi

MIT-lisenssi - katso [LICENSE](LICENSE) yksityiskohtia varten.

---

<p align="center">
  Tehty ❤️ kryptoyhteisölle
</p>
