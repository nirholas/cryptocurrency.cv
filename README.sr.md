🌐 **Језици:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [Hrvatski](README.hr.md) | [Slovenščina](README.sl.md) | [Српски](README.sr.md)

---

# 🆓 Бесплатни Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Звездице"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Лиценца"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Статус"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Ако вам је ово корисно, молимо дајте репозиторијуму звездицу!** То помаже другима да открију овај пројекат.

---

Добијте crypto вести у реалном времену из **200+ извора** једним API позивом.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | Остали   |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Цена**          | 🆓 Заувек бесплатно             | $29-299/мес  | Плаћено  |
| **API Кључ**      | ❌ Није потребан                | Обавезан     | Обавезан |
| **Rate Limit**    | Неограничено*                   | 100-1000/дан | Ограничено|
| **Извори**        | 130+ Енглески + 75 Међународних | 1            | Варира   |
| **Међународно**   | 🌏 KO, ZH, JA, ES + превод      | Не           | Не       |
| **Self-host**     | ✅ Једним кликом                | Не           | Не       |
| **PWA**           | ✅ Инсталабилно                 | Не           | Не       |
| **MCP**           | ✅ Claude + ChatGPT             | Не           | Не       |

---

## 🌍 Међународни Извори Вести

Добијте crypto вести из **75 међународних извора** на 18 језика — са аутоматским преводом на енглески!

| Језик          | Број  | Примери Извора                                  |
| -------------- | ----- | ----------------------------------------------- |
| 🇨🇳 Кинески    | 10    | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 Корејски   | 9     | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 Јапански   | 6     | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 Португалски| 5     | Cointelegraph Brasil, Livecoins                 |
| 🇪🇸 Шпански    | 5     | Cointelegraph Español, Diario Bitcoin           |

### Брзи Примери

```bash
# Добијте најновије вести
curl "https://cryptocurrency.cv/api/news?limit=10"

# Добијте Bitcoin сентимент
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Претражите чланке
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Прогресивна Веб Апликација (PWA)

Free Crypto News је **потпуно инсталабилна PWA** која ради офлајн!

| Функција                | Опис                                    |
| ----------------------- | --------------------------------------- |
| 📲 **Инсталабилно**     | Додајте на почетни екран на било ком уређају |
| 📴 **Офлајн Режим**     | Читајте кеширане вести без интернета    |
| 🔔 **Push Обавештења**  | Добијајте аларме за breaking вести      |
| ⚡ **Муњевито Брзо**    | Агресивне стратегије кеширања           |

---

## 🔌 API Крајње Тачке

| Крајња Тачка                    | Опис                                   |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | Најновије из свих извора               |
| `/api/search?q=bitcoin`         | Претрага по кључним речима             |
| `/api/bitcoin`                  | Bitcoin-специфичне вести               |
| `/api/breaking`                 | Само последња 2 сата                   |
| `/api/trending`                 | Trending теме са сентиментом           |
| `/api/ai/sentiment?asset=BTC`   | AI анализа сентимента                  |
| `/api/ai/digest`                | AI-генерисани сажетак                  |
| `/api/market/fear-greed`        | Индекс Страха и Похлепе                |
| `/api/whales`                   | Упозорења о китовима                   |
| `/api/trading/signals`          | Трговачки сигнали                      |

---

## 🤖 AI Функције

Све AI функције су **БЕСПЛАТНЕ** преко Groq:

| Крајња Тачка         | Опис                                   |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | Дубока анализа сентимента              |
| `/api/ai/summarize`  | AI сажеци                              |
| `/api/ai/ask`        | Постављајте питања о cryptu           |
| `/api/ai/digest`     | Дневни сажетак                         |
| `/api/ai/narratives` | Праћење тржишних наратива              |
| `/api/ai/factcheck`  | Провера чињеница                       |

---

## 📦 SDK-ови и Примери

| Језик      | Пакет                           |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 Брзи Почетак

### Са Vercel (Препоручено)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Локално

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 Доприноси

Доприноси су добродошли! Погледајте [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Лиценца

MIT © [nirholas](https://github.com/nirholas)
