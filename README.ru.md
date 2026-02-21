🌐 **Язык:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Бесплатный API Крипто Новостей

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Звёзды"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Лицензия"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Статус CI"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Демо Free Crypto News API" width="700">
</p>

> ⭐ **Если это полезно, поставьте звезду репозиторию!** Это помогает другим найти проект и мотивирует продолжать разработку.

---
Получайте крипто новости в реальном времени из 7 основных источников одним API-запросом.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Другие |
|---|---|---|---|
| **Цена** | 🆓 Бесплатно навсегда | $29-299/мес | Платно |
| **API Ключ** | ❌ Не требуется | Требуется | Требуется |
| **Лимит запросов** | Без ограничений* | 100-1000/день | Ограничено |
| **Источники** | 12 англ. + 12 международных | 1 | Разные |
| **Интернационализация** | 🌏 Корейский, Китайский, Японский, Испанский + перевод | Нет | Нет |
| **Самостоятельный хостинг** | ✅ Деплой в один клик | Нет | Нет |
| **PWA** | ✅ Устанавливаемое | Нет | Нет |
| **MCP** | ✅ Claude + ChatGPT | Нет | Нет |

---

## 🌍 Международные Источники Новостей

Получайте крипто новости из **75 международных источников** на 18 языках — автоматически переведённые на английский!

### Поддерживаемые Источники

| Регион | Источники |
|--------|---------|
| 🇰🇷 **Корея** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Китай** | 8BTC (Бабит), Jinse Finance (Цзиньсэ), Odaily (Одейли) |
| 🇯🇵 **Япония** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Латинская Америка** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Быстрые Примеры

```bash
# Получить все международные новости
curl "https://cryptocurrency.cv/api/news/international"

# Получить корейские новости с переводом на английский
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Получить новости азиатского региона
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Возможности

- ✅ **Автоматический перевод** на английский через Groq AI
- ✅ **7-дневный кеш переводов** для эффективности
- ✅ Сохранение **оригинала + английского**
- ✅ **Ограничение скорости** (1 запрос/сек) для уважения API
- ✅ **Graceful fallback** для недоступных источников
- ✅ **Дедупликация** между источниками

---

## 📱 Прогрессивное Веб-Приложение (PWA)

Free Crypto News — это **полностью устанавливаемое PWA** с поддержкой офлайн!

### Возможности

| Функция | Описание |
|---------|-------------|
| 📲 **Устанавливаемое** | Добавьте на домашний экран любого устройства |
| 📴 **Офлайн режим** | Читайте кешированные новости без сети |
| 🔔 **Push-уведомления** | Получайте оповещения о срочных новостях |
| ⚡ **Молниеносная скорость** | Агрессивные стратегии кеширования |
| 🔄 **Фоновая синхронизация** | Автообновление при восстановлении связи |

### Установка Приложения

**Десктоп (Chrome/Edge):**
1. Посетите [cryptocurrency.cv](https://cryptocurrency.cv)
2. Нажмите иконку установки (⊕) в адресной строке
3. Нажмите "Установить"

**iOS Safari:**
1. Посетите сайт в Safari
2. Нажмите Поделиться (📤) → "На экран Домой"

**Android Chrome:**
1. Посетите сайт
2. Нажмите баннер установки или Меню → "Установить приложение"

---

## Источники

Мы агрегируем из **7 надёжных СМИ**:

- 🟠 **CoinDesk** — Общие крипто новости
- 🔵 **The Block** — Институциональные и исследования
- 🟢 **Decrypt** — Web3 и культура
- 🟡 **CoinTelegraph** — Глобальные крипто новости
- 🟤 **Bitcoin Magazine** — Биткоин максималисты
- 🟣 **Blockworks** — DeFi и институциональные
- 🔴 **The Defiant** — Нативный DeFi

---

## Эндпоинты

| Эндпоинт | Описание |
|----------|-------------|
| `/api/news` | Последние новости из всех источников |
| `/api/search?q=bitcoin` | Поиск по ключевому слову |
| `/api/defi` | Новости о DeFi |
| `/api/bitcoin` | Новости о Bitcoin |
| `/api/breaking` | Только за последние 2 часа |
| `/api/trending` | Трендовые темы с анализом настроений |
| `/api/analyze` | Новости с категоризацией тем |
| `/api/stats` | Аналитика и статистика |

### 🤖 AI-Powered Эндпоинты (Бесплатно через Groq)

| Эндпоинт | Описание |
|----------|-------------|
| `/api/summarize` | AI-сводка статей |
| `/api/ask?q=...` | Задайте вопрос о крипто новостях |
| `/api/digest` | AI-генерированный ежедневный дайджест |
| `/api/sentiment` | Глубокий анализ настроений каждой статьи |

---

## SDK и Компоненты

| Пакет | Описание |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` готовый к использованию компонент |
| [TypeScript](sdk/typescript/) | Полный TypeScript SDK |
| [Python](sdk/python/) | Python клиент без зависимостей |
| [JavaScript](sdk/javascript/) | SDK для браузера и Node.js |
| [Go](sdk/go/) | Go клиентская библиотека |
| [PHP](sdk/php/) | PHP SDK |

**Base URL:** `https://cryptocurrency.cv`

---

# Самостоятельный Хостинг

## Деплой в Один Клик

[![Деплой на Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Вручную

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Откройте http://localhost:3000/api/news

---

# Лицензия

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Хватит платить за крипто новостные API.</b><br>
  <sub>Сделано с 💜 для сообщества</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Полезно? Поставьте звезду!</b> ⭐<br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Звезда на GitHub">
  </a>
</p>

