🌐 **Langues:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 API Free Crypto News

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="Étoiles GitHub"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licence"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Statut CI"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Démo de l'API Free Crypto News" width="700">
</p>

> ⭐ **Si vous trouvez cela utile, mettez une étoile au repo !** Cela aide les autres à découvrir ce projet et motive le développement continu.

---
Obtenez des actualités crypto en temps réel de 7 sources majeures avec un seul appel API.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Autres |
|---|---|---|---|
| **Prix** | 🆓 Gratuit pour toujours | 29-299$/mois | Payant |
| **Clé API** | ❌ Non requise | Requise | Requise |
| **Limite de requêtes** | Illimité* | 100-1000/jour | Limité |
| **Sources** | 12 Anglais + 12 International | 1 | Varie |
| **International** | 🌏 KO, ZH, JA, ES + traduction | Non | Non |
| **Auto-hébergement** | ✅ Un clic | Non | Non |
| **PWA** | ✅ Installable | Non | Non |
| **MCP** | ✅ Claude + ChatGPT | Non | Non |

---

## 🌍 Sources d'Actualités Internationales

Obtenez des actualités crypto de **75 sources internationales** en 18 langues — avec traduction automatique en anglais !

### Sources Supportées

| Région | Sources |
|--------|---------|
| 🇰🇷 **Corée** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Chine** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japon** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Amérique Latine** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Exemples Rapides

```bash
# Obtenir toutes les actualités internationales
curl "https://cryptocurrency.cv/api/news/international"

# Obtenir les actualités coréennes avec traduction anglaise
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Obtenir les actualités de la région asiatique
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Fonctionnalités

- ✅ **Traduction automatique** en anglais via Groq AI
- ✅ **Cache de traduction de 7 jours** pour l'efficacité
- ✅ **Texte original + anglais** préservé
- ✅ **Limitation de débit** (1 req/sec) pour respecter les APIs
- ✅ **Gestion de secours** pour les sources indisponibles
- ✅ **Déduplication** entre les sources

---

## 📱 Application Web Progressive (PWA)

Free Crypto News est une **PWA entièrement installable** qui fonctionne hors ligne !

### Fonctionnalités

| Fonctionnalité | Description |
|---------|-------------|
| 📲 **Installable** | Ajouter à l'écran d'accueil sur n'importe quel appareil |
| 📴 **Mode Hors Ligne** | Lire les actualités en cache sans internet |
| 🔔 **Notifications Push** | Recevoir des alertes d'actualités de dernière minute |
| ⚡ **Ultra Rapide** | Stratégies de mise en cache agressives |
| 🔄 **Synchronisation en Arrière-plan** | Mises à jour automatiques au retour en ligne |

### Installer l'Application

**Bureau (Chrome/Edge):**
1. Visitez [cryptocurrency.cv](https://cryptocurrency.cv)
2. Cliquez sur l'icône d'installation (⊕) dans la barre d'adresse
3. Cliquez sur "Installer"

**iOS Safari:**
1. Visitez le site dans Safari
2. Appuyez sur Partager (📤) → "Sur l'écran d'accueil"

**Android Chrome:**
1. Visitez le site
2. Appuyez sur la bannière d'installation ou Menu → "Installer l'application"

---

## Sources

Nous agrégeons de **7 médias de confiance** :

- 🟠 **CoinDesk** — Actualités crypto générales
- 🔵 **The Block** — Institutionnel & recherche
- 🟢 **Decrypt** — Web3 & culture
- 🟡 **CoinTelegraph** — Actualités crypto mondiales
- 🟤 **Bitcoin Magazine** — Maximaliste Bitcoin
- 🟣 **Blockworks** — DeFi & institutions
- 🔴 **The Defiant** — Natif DeFi

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/news` | Dernières de toutes les sources |
| `/api/search?q=bitcoin` | Rechercher par mots-clés |
| `/api/defi` | Actualités spécifiques DeFi |
| `/api/bitcoin` | Actualités spécifiques Bitcoin |
| `/api/breaking` | Dernières 2 heures seulement |
| `/api/trending` | Sujets tendance avec sentiment |
| `/api/analyze` | Actualités avec classification de sujets |
| `/api/stats` | Analytiques & statistiques |
| `/api/sources` | Lister toutes les sources |
| `/api/health` | État de santé de l'API & flux |

### 🤖 Endpoints Alimentés par IA (GRATUIT via Groq)

| Endpoint | Description |
|----------|-------------|
| `/api/summarize` | Résumés IA des articles |
| `/api/ask?q=...` | Poser des questions sur les actualités crypto |
| `/api/digest` | Résumé quotidien généré par IA |
| `/api/sentiment` | Analyse de sentiment approfondie par article |
| `/api/entities` | Extraire personnes, entreprises, tickers |
| `/api/narratives` | Identifier les narratifs et thèmes du marché |
| `/api/signals` | Signaux de trading basés sur les actualités (éducatif) |

---

## SDKs & Composants

| Package | Description |
|---------|-------------|
| [React](sdk/react/) | Composants `<CryptoNews />` prêts à l'emploi |
| [TypeScript](sdk/typescript/) | SDK TypeScript complet |
| [Python](sdk/python/) | Client Python sans dépendances |
| [JavaScript](sdk/javascript/) | SDK navigateur & Node.js |
| [Go](sdk/go/) | Bibliothèque cliente Go |
| [PHP](sdk/php/) | SDK PHP |

**URL de Base:** `https://cryptocurrency.cv`

---

## Format de Réponse

```json
{
  "articles": [
    {
      "title": "Bitcoin Atteint un Nouveau ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin a dépassé...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "il y a 2h"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# Exemples d'Intégration

Choisissez votre plateforme. Copiez le code. Déployez.

---

## 🐍 Python

**Zéro dépendance.** Copiez simplement le fichier.

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Obtenir les dernières actualités
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")
```

---

## 🟨 JavaScript / TypeScript

**Fonctionne dans Node.js et les navigateurs.**

### SDK TypeScript (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// Réponses entièrement typées
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

---

# Auto-Hébergement

## Déploiement en Un Clic

[![Déployer avec Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manuel

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Ouvrez http://localhost:3000/api/news

## Variables d'Environnement

**Toutes les variables d'environnement sont optionnelles.** Le projet fonctionne sans configuration.

| Variable | Par Défaut | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Active la traduction automatique i18n (18 langues). **GRATUIT !** Obtenez la vôtre sur [console.groq.com/keys](https://console.groq.com/keys) |
| `FEATURE_TRANSLATION` | `false` | Définir sur `true` pour activer la traduction en temps réel |

---

# Stack Technique

- **Runtime:** Next.js 14 Edge Functions
- **Hébergement:** Niveau gratuit Vercel
- **Données:** Parsing RSS direct (pas de base de données)
- **Cache:** Cache edge de 5 minutes

---

# Contribuer

Les PRs sont les bienvenues ! Idées :

- [ ] Plus de sources d'actualités
- [x] ~~Analyse de sentiment~~ ✅ Fait
- [x] ~~Classification de sujets~~ ✅ Fait
- [x] ~~Flux WebSocket en temps réel~~ ✅ Fait
- [ ] SDKs Rust / Ruby
- [ ] Application mobile (React Native)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Guide Utilisateur](docs/USER-GUIDE.md) | Fonctionnalités utilisateur, raccourcis clavier, PWA |
| [Guide Développeur](docs/DEVELOPER-GUIDE.md) | Architecture, composants, extension de l'app |
| [Contribuer](CONTRIBUTING.md) | Comment contribuer |
| [Changelog](CHANGELOG.md) | Historique des versions |
| [Sécurité](SECURITY.md) | Politique de sécurité |

---

# Licence

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Arrêtez de payer pour les APIs d'actualités crypto.</b><br>
  <sub>Fait avec 💜 pour la communauté</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Vous avez trouvé cela utile ? Mettez une étoile !</b> ⭐<br>
  <sub>Cela aide les autres à découvrir ce projet et maintient le développement actif</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Étoile sur GitHub">
  </a>
</p>
