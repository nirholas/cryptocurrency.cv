🌐 **Sprachen:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Free Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Sterne"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lizenz"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Wenn Sie das nützlich finden, geben Sie dem Repo einen Stern!** Es hilft anderen, dieses Projekt zu entdecken und motiviert die kontinuierliche Entwicklung.

---
Erhalten Sie Echtzeit-Krypto-Nachrichten von 7 großen Quellen mit einem einzigen API-Aufruf.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Andere |
|---|---|---|---|
| **Preis** | 🆓 Für immer kostenlos | $29-299/Monat | Kostenpflichtig |
| **API-Schlüssel** | ❌ Nicht erforderlich | Erforderlich | Erforderlich |
| **Ratenlimit** | Unbegrenzt* | 100-1000/Tag | Begrenzt |
| **Quellen** | 12 Englisch + 12 International | 1 | Variiert |
| **International** | 🌏 KO, ZH, JA, ES + Übersetzung | Nein | Nein |
| **Self-Hosting** | ✅ Ein Klick | Nein | Nein |
| **PWA** | ✅ Installierbar | Nein | Nein |
| **MCP** | ✅ Claude + ChatGPT | Nein | Nein |

---

## 🌍 Internationale Nachrichtenquellen

Erhalten Sie Krypto-Nachrichten von **75 internationalen Quellen** in 18 Sprachen — mit automatischer Übersetzung ins Englische!

### Unterstützte Quellen

| Region | Quellen |
|--------|---------|
| 🇰🇷 **Korea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **China** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japan** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Lateinamerika** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Schnelle Beispiele

```bash
# Alle internationalen Nachrichten abrufen
curl "https://cryptocurrency.cv/api/news/international"

# Koreanische Nachrichten mit englischer Übersetzung
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Nachrichten aus der asiatischen Region
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Funktionen

- ✅ **Auto-Übersetzung** ins Englische via Groq AI
- ✅ **7-Tage-Übersetzungscache** für Effizienz
- ✅ **Original + Englischer** Text erhalten
- ✅ **Ratenlimitierung** (1 Anfrage/Sek.) zur Respektierung der APIs
- ✅ **Fallback-Handling** für nicht verfügbare Quellen
- ✅ **Deduplizierung** über Quellen hinweg

---

## 📱 Progressive Web App (PWA)

Free Crypto News ist eine **vollständig installierbare PWA**, die offline funktioniert!

### Funktionen

| Funktion | Beschreibung |
|---------|-------------|
| 📲 **Installierbar** | Zum Startbildschirm auf jedem Gerät hinzufügen |
| 📴 **Offline-Modus** | Gecachte Nachrichten ohne Internet lesen |
| 🔔 **Push-Benachrichtigungen** | Eilmeldungen erhalten |
| ⚡ **Blitzschnell** | Aggressive Caching-Strategien |
| 🔄 **Hintergrund-Sync** | Automatische Updates bei Wiederverbindung |

### App Installieren

**Desktop (Chrome/Edge):**
1. Besuchen Sie [cryptocurrency.cv](https://cryptocurrency.cv)
2. Klicken Sie auf das Installations-Symbol (⊕) in der Adressleiste
3. Klicken Sie auf "Installieren"

**iOS Safari:**
1. Besuchen Sie die Seite in Safari
2. Tippen Sie auf Teilen (📤) → "Zum Home-Bildschirm"

**Android Chrome:**
1. Besuchen Sie die Seite
2. Tippen Sie auf das Installationsbanner oder Menü → "App installieren"

---

## Quellen

Wir aggregieren von **7 vertrauenswürdigen Medien**:

- 🟠 **CoinDesk** — Allgemeine Krypto-Nachrichten
- 🔵 **The Block** — Institutionell & Forschung
- 🟢 **Decrypt** — Web3 & Kultur
- 🟡 **CoinTelegraph** — Globale Krypto-Nachrichten
- 🟤 **Bitcoin Magazine** — Bitcoin-Maximalist
- 🟣 **Blockworks** — DeFi & Institutionen
- 🔴 **The Defiant** — DeFi-nativ

---

## Endpoints

| Endpoint | Beschreibung |
|----------|-------------|
| `/api/news` | Neueste von allen Quellen |
| `/api/search?q=bitcoin` | Nach Schlüsselwörtern suchen |
| `/api/defi` | DeFi-spezifische Nachrichten |
| `/api/bitcoin` | Bitcoin-spezifische Nachrichten |
| `/api/breaking` | Nur die letzten 2 Stunden |
| `/api/trending` | Trendthemen mit Sentiment |
| `/api/analyze` | Nachrichten mit Themenklassifizierung |
| `/api/stats` | Analytik & Statistiken |
| `/api/sources` | Alle Quellen auflisten |
| `/api/health` | API- & Feed-Gesundheitsstatus |

### 🤖 KI-gestützte Endpoints (KOSTENLOS via Groq)

| Endpoint | Beschreibung |
|----------|-------------|
| `/api/summarize` | KI-Zusammenfassungen von Artikeln |
| `/api/ask?q=...` | Fragen zu Krypto-Nachrichten stellen |
| `/api/digest` | KI-generierte tägliche Zusammenfassung |
| `/api/sentiment` | Tiefe Sentimentanalyse pro Artikel |
| `/api/entities` | Personen, Unternehmen, Ticker extrahieren |
| `/api/narratives` | Marktnarrative & Themen identifizieren |
| `/api/signals` | Nachrichtenbasierte Trading-Signale (pädagogisch) |

---

## SDKs & Komponenten

| Paket | Beschreibung |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` Drop-in-Komponenten |
| [TypeScript](sdk/typescript/) | Vollständiges TypeScript SDK |
| [Python](sdk/python/) | Zero-Dependency Python-Client |
| [JavaScript](sdk/javascript/) | Browser & Node.js SDK |
| [Go](sdk/go/) | Go-Client-Bibliothek |
| [PHP](sdk/php/) | PHP SDK |

**Basis-URL:** `https://cryptocurrency.cv`

---

## Antwortformat

```json
{
  "articles": [
    {
      "title": "Bitcoin Erreicht Neues ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin übertraf...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "vor 2 Std."
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# Integrationsbeispiele

Wählen Sie Ihre Plattform. Kopieren Sie den Code. Deployen Sie.

---

## 🐍 Python

**Keine Abhängigkeiten.** Kopieren Sie einfach die Datei.

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Neueste Nachrichten abrufen
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")
```

---

## 🟨 JavaScript / TypeScript

**Funktioniert in Node.js und Browsern.**

### TypeScript SDK (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// Vollständig typisierte Antworten
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

---

# Self-Hosting

## Ein-Klick-Deployment

[![Mit Vercel deployen](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manuell

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Öffnen Sie http://localhost:3000/api/news

## Umgebungsvariablen

**Alle Umgebungsvariablen sind optional.** Das Projekt funktioniert ohne Konfiguration.

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Aktiviert i18n-Auto-Übersetzung (18 Sprachen). **KOSTENLOS!** Holen Sie sich Ihren auf [console.groq.com/keys](https://console.groq.com/keys) |
| `FEATURE_TRANSLATION` | `false` | Auf `true` setzen für Echtzeit-Übersetzung |

---

# Tech-Stack

- **Runtime:** Next.js 14 Edge Functions
- **Hosting:** Vercel kostenloses Tier
- **Daten:** Direktes RSS-Parsing (keine Datenbank)
- **Cache:** 5-Minuten Edge-Cache

---

# Beitragen

PRs sind willkommen! Ideen:

- [ ] Mehr Nachrichtenquellen
- [x] ~~Sentimentanalyse~~ ✅ Erledigt
- [x] ~~Themenklassifizierung~~ ✅ Erledigt
- [x] ~~WebSocket Echtzeit-Feed~~ ✅ Erledigt
- [ ] Rust / Ruby SDKs
- [ ] Mobile App (React Native)

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| [Benutzerhandbuch](docs/USER-GUIDE.md) | Endbenutzer-Funktionen, Tastaturkürzel, PWA |
| [Entwicklerhandbuch](docs/DEVELOPER-GUIDE.md) | Architektur, Komponenten, App erweitern |
| [Beitragen](CONTRIBUTING.md) | Wie man beiträgt |
| [Changelog](CHANGELOG.md) | Versionshistorie |
| [Sicherheit](SECURITY.md) | Sicherheitsrichtlinie |

---

# Lizenz

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Hören Sie auf, für Krypto-News-APIs zu bezahlen.</b><br>
  <sub>Mit 💜 für die Community gemacht</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Fanden Sie das nützlich? Geben Sie einen Stern!</b> ⭐<br>
  <sub>Es hilft anderen, dieses Projekt zu entdecken und hält die Entwicklung am Laufen</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Stern auf GitHub">
  </a>
</p>
