🌐 **Język:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Darmowe API Wiadomości Crypto

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="Gwiazdki GitHub"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licencja"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Status CI"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Demo Free Crypto News API" width="700">
</p>

> ⭐ **Jeśli to przydatne, daj gwiazdkę repozytorium!** To pomaga innym odkryć projekt i motywuje do dalszego rozwoju.

---
Otrzymuj wiadomości crypto w czasie rzeczywistym z 7 głównych źródeł jednym wywołaniem API.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Inne |
|---|---|---|---|
| **Cena** | 🆓 Zawsze za darmo | $29-299/miesiąc | Płatne |
| **Klucz API** | ❌ Nie wymagany | Wymagany | Wymagany |
| **Limit zapytań** | Bez limitu* | 100-1000/dzień | Ograniczony |
| **Źródła** | 130+ angielskich + 75 międzynarodowych | 1 | Różne |
| **Internacjonalizacja** | 🌏 Koreański, Chiński, Japoński, Hiszpański + tłumaczenie | Nie | Nie |
| **Self-hosting** | ✅ Deploy jednym kliknięciem | Nie | Nie |
| **PWA** | ✅ Instalowalne | Nie | Nie |
| **MCP** | ✅ Claude + ChatGPT | Nie | Nie |

---

## 🌍 Międzynarodowe Źródła Wiadomości

Otrzymuj wiadomości crypto z **75 międzynarodowych źródeł** w 18 językach — automatycznie tłumaczone na angielski!

### Obsługiwane Źródła

| Region | Źródła |
|--------|---------|
| 🇰🇷 **Korea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Chiny** | 8BTC (Babit), Jinse Finance (Jinse), Odaily (Odaily) |
| 🇯🇵 **Japonia** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Ameryka Łacińska** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Szybkie Przykłady

```bash
# Pobierz wszystkie międzynarodowe wiadomości
curl "https://cryptocurrency.cv/api/news/international"

# Pobierz koreańskie wiadomości przetłumaczone na angielski
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Pobierz wiadomości z regionu azjatyckiego
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Funkcje

- ✅ **Automatyczne tłumaczenie** na angielski przez Groq AI
- ✅ **7-dniowy cache tłumaczeń** dla wydajności
- ✅ Zachowuje **oryginał + angielski**
- ✅ **Rate limiting** (1 zapytanie/sek) respektuje API
- ✅ **Graceful fallback** dla niedostępnych źródeł
- ✅ **Deduplikacja** między źródłami

---

## 📱 Progressive Web App (PWA)

Free Crypto News to **w pełni instalowalna PWA** z obsługą offline!

### Funkcje

| Funkcja | Opis |
|---------|-------------|
| 📲 **Instalowalna** | Dodaj do ekranu głównego na dowolnym urządzeniu |
| 📴 **Tryb Offline** | Czytaj cached wiadomości bez sieci |
| 🔔 **Powiadomienia Push** | Otrzymuj alerty o breaking news |
| ⚡ **Błyskawiczna** | Agresywne strategie cachowania |
| 🔄 **Sync w Tle** | Automatyczna aktualizacja po powrocie online |

### Instalacja Aplikacji

**Desktop (Chrome/Edge):**
1. Odwiedź [cryptocurrency.cv](https://cryptocurrency.cv)
2. Kliknij ikonę instalacji (⊕) w pasku URL
3. Kliknij "Zainstaluj"

**iOS Safari:**
1. Odwiedź stronę w Safari
2. Dotknij Udostępnij (📤) → "Dodaj do ekranu głównego"

**Android Chrome:**
1. Odwiedź stronę
2. Dotknij banner instalacji lub Menu → "Zainstaluj aplikację"

---

## Źródła

Agregujemy z **7 zaufanych mediów**:

- 🟠 **CoinDesk** — Ogólne wiadomości crypto
- 🔵 **The Block** — Instytucjonalne i badania
- 🟢 **Decrypt** — Web3 i kultura
- 🟡 **CoinTelegraph** — Globalne wiadomości crypto
- 🟤 **Bitcoin Magazine** — Bitcoin maksymaliści
- 🟣 **Blockworks** — DeFi i instytucjonalne
- 🔴 **The Defiant** — Natywne DeFi

---

## Endpointy

| Endpoint | Opis |
|----------|-------------|
| `/api/news` | Najnowsze wiadomości ze wszystkich źródeł |
| `/api/search?q=bitcoin` | Szukaj po słowie kluczowym |
| `/api/defi` | Wiadomości związane z DeFi |
| `/api/bitcoin` | Wiadomości związane z Bitcoin |
| `/api/breaking` | Tylko ostatnie 2 godziny |
| `/api/trending` | Trendy z analizą sentymentu |
| `/api/analyze` | Wiadomości z kategoryzacją tematów |
| `/api/stats` | Analizy i statystyki |

### 🤖 Endpointy AI-Powered (Za darmo przez Groq)

| Endpoint | Opis |
|----------|-------------|
| `/api/summarize` | AI podsumowanie artykułów |
| `/api/ask?q=...` | Zadawaj pytania o wiadomości crypto |
| `/api/digest` | AI-generowane dzienne podsumowanie |
| `/api/sentiment` | Głęboka analiza sentymentu na artykuł |

---

## SDK i Komponenty

| Pakiet | Opis |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` komponent plug-and-play |
| [TypeScript](sdk/typescript/) | Pełne TypeScript SDK |
| [Python](sdk/python/) | Klient Python bez zależności |
| [JavaScript](sdk/javascript/) | SDK dla przeglądarki i Node.js |
| [Go](sdk/go/) | Biblioteka klienta Go |
| [PHP](sdk/php/) | PHP SDK |

**Base URL:** `https://cryptocurrency.cv`

---

# Self-Hosting

## Deploy Jednym Kliknięciem

[![Deploy z Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Ręcznie

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Otwórz http://localhost:3000/api/news

---

# Licencja

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Przestań płacić za API wiadomości crypto.</b><br>
  <sub>Zrobione z 💜 dla społeczności</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Przydatne? Daj gwiazdkę!</b> ⭐<br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Gwiazdka na GitHub">
  </a>
</p>

