🌐 **Idiomas:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 API de Noticias Cripto Gratuita

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="Estrellas de GitHub"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licencia"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Demo de la API Free Crypto News" width="700">
</p>

> ⭐ **¡Si te resulta útil, dale una estrella al repo!** Ayuda a otros a descubrir este proyecto y motiva el desarrollo continuo.

---
Obtén noticias cripto en tiempo real de 7 fuentes principales con una sola llamada a la API.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Otros |
|---|---|---|---|
| **Precio** | 🆓 Gratis para siempre | $29-299/mes | Pago |
| **Clave API** | ❌ No necesaria | Requerida | Requerida |
| **Límite de tasa** | Ilimitado* | 100-1000/día | Limitado |
| **Fuentes** | 12 Inglés + 12 Internacional | 1 | Varía |
| **Internacional** | 🌏 KO, ZH, JA, ES + traducción | No | No |
| **Auto-hospedaje** | ✅ Un clic | No | No |
| **PWA** | ✅ Instalable | No | No |
| **MCP** | ✅ Claude + ChatGPT | No | No |

---

## 🌿 Ramas

| Rama | Descripción |
|--------|-------------|
| `main` | Rama de producción estable — Diseño original centrado en API |
| `redesign/pro-news-ui` | Rediseño premium de UI — Estilo CoinDesk/CoinTelegraph con modo oscuro, componentes mejorados, datos estructurados SEO y soporte completo PWA |

Para probar el rediseño localmente:
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 Fuentes de Noticias Internacionales

Obtén noticias cripto de **12 fuentes internacionales** en coreano, chino, japonés y español — ¡con traducción automática al inglés!

### Fuentes Soportadas

| Región | Fuentes |
|--------|---------|
| 🇰🇷 **Corea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **China** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japón** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **América Latina** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Ejemplos Rápidos

```bash
# Obtener todas las noticias internacionales
curl "https://cryptocurrency.cv/api/news/international"

# Obtener noticias coreanas con traducción al inglés
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Obtener noticias de la región asiática
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Características

- ✅ **Auto-traducción** al inglés vía Groq AI
- ✅ **Caché de traducción de 7 días** para eficiencia
- ✅ **Texto original + inglés** preservado
- ✅ **Límite de tasa** (1 req/seg) para respetar las APIs
- ✅ **Manejo de fallback** para fuentes no disponibles
- ✅ **Deduplicación** entre fuentes

Ver [documentación de la API](docs/API.md#get-apinewsinternational) para detalles completos.

---

## 📱 Aplicación Web Progresiva (PWA)

Free Crypto News es una **PWA completamente instalable** que funciona sin conexión.

### Características

| Característica | Descripción |
|---------|-------------|
| 📲 **Instalable** | Añadir a la pantalla de inicio en cualquier dispositivo |
| 📴 **Modo Sin Conexión** | Leer noticias en caché sin internet |
| 🔔 **Notificaciones Push** | Recibir alertas de noticias de última hora |
| ⚡ **Ultra Rápido** | Estrategias de caché agresivas |
| 🔄 **Sincronización en Segundo Plano** | Actualizaciones automáticas al volver a estar en línea |
| 🎯 **Accesos Directos** | Acceso rápido a Últimas, Breaking, Bitcoin |
| 📤 **Objetivo de Compartir** | Compartir enlaces directamente a la app |
| 🚨 **Alertas en Tiempo Real** | Alertas configurables para precio y condiciones de noticias |

### Instalar la App

**Escritorio (Chrome/Edge):**
1. Visita [cryptocurrency.cv](https://cryptocurrency.cv)
2. Haz clic en el icono de instalación (⊕) en la barra de direcciones
3. Haz clic en "Instalar"

**iOS Safari:**
1. Visita el sitio en Safari
2. Toca Compartir (📤) → "Añadir a la pantalla de inicio"

**Android Chrome:**
1. Visita el sitio
2. Toca el banner de instalación o Menú → "Instalar app"

### Caché del Service Worker

La PWA usa estrategias de caché inteligentes:

| Contenido | Estrategia | Duración del Caché |
|---------|----------|----------------|
| Respuestas API | Network-first | 5 minutos |
| Activos estáticos | Cache-first | 7 días |
| Imágenes | Cache-first | 30 días |
| Navegación | Network-first + fallback offline | 24 horas |

### Atajos de Teclado

Navega rápidamente por las noticias con el teclado:

| Atajo | Acción |
|----------|--------|
| `j` / `k` | Artículo siguiente / anterior |
| `/` | Enfocar búsqueda |
| `Enter` | Abrir artículo seleccionado |
| `d` | Alternar modo oscuro |
| `g h` | Ir a Inicio |
| `g t` | Ir a Tendencias |
| `g s` | Ir a Fuentes |
| `g b` | Ir a Marcadores |
| `?` | Mostrar todos los atajos |
| `Escape` | Cerrar modal |

📖 **Guía completa del usuario:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## Fuentes

Agregamos de **7 medios confiables**:

- 🟠 **CoinDesk** — Noticias cripto generales
- 🔵 **The Block** — Institucional e investigación
- 🟢 **Decrypt** — Web3 y cultura
- 🟡 **CoinTelegraph** — Noticias cripto globales
- 🟤 **Bitcoin Magazine** — Maximalista de Bitcoin
- 🟣 **Blockworks** — DeFi e instituciones
- 🔴 **The Defiant** — Nativo de DeFi

---

## Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `/api/news` | Últimas de todas las fuentes |
| `/api/search?q=bitcoin` | Buscar por palabras clave |
| `/api/defi` | Noticias específicas de DeFi |
| `/api/bitcoin` | Noticias específicas de Bitcoin |
| `/api/breaking` | Solo las últimas 2 horas |
| `/api/trending` | Temas tendencia con sentimiento |
| `/api/analyze` | Noticias con clasificación de temas |
| `/api/stats` | Analíticas y estadísticas |
| `/api/sources` | Listar todas las fuentes |
| `/api/health` | Estado de salud de la API y feeds |
| `/api/rss` | Feed RSS agregado |
| `/api/atom` | Feed Atom agregado |
| `/api/opml` | Exportación OPML para lectores RSS |
| `/api/docs` | Documentación interactiva de la API |
| `/api/webhooks` | Registro de webhooks |
| `/api/archive` | Archivo histórico de noticias |
| `/api/push` | Notificaciones Web Push |
| `/api/origins` | Encontrar fuentes originales de noticias |
| `/api/portfolio` | Noticias basadas en portfolio + precios |
| `/api/news/international` | Fuentes internacionales con traducción |

### 🤖 Endpoints Potenciados por IA (GRATIS vía Groq)

| Endpoint | Descripción |
|----------|-------------|
| `/api/summarize` | Resúmenes IA de artículos |
| `/api/ask?q=...` | Hacer preguntas sobre noticias cripto |
| `/api/digest` | Resumen diario generado por IA |
| `/api/sentiment` | Análisis profundo de sentimiento por artículo |
| `/api/entities` | Extraer personas, empresas, tickers |
| `/api/narratives` | Identificar narrativas y temas del mercado |
| `/api/signals` | Señales de trading basadas en noticias (educativo) |
| `/api/factcheck` | Extraer y verificar afirmaciones |
| `/api/clickbait` | Detectar titulares clickbait |
| `/api/classify` | Clasificación de eventos (13 tipos) |
| `/api/claims` | Extracción de afirmaciones con atribución |
| `/api/ai/brief` | Resúmenes de artículos generados por IA |
| `/api/ai/counter` | Generación de contraargumentos |
| `/api/ai/debate` | Debate IA sobre temas cripto |

### 📊 Analíticas e Inteligencia

| Endpoint | Descripción |
|----------|-------------|
| `/api/analytics/anomalies` | Detectar patrones de cobertura inusuales |
| `/api/analytics/credibility` | Puntuación de credibilidad de fuentes |
| `/api/analytics/headlines` | Seguimiento y mutaciones de titulares |

### 📈 Datos de Mercado

| Endpoint | Descripción |
|----------|-------------|
| `/api/market/coins` | Listar todas las monedas con datos de mercado |
| `/api/market/trending` | Criptomonedas en tendencia |
| `/api/market/categories` | Categorías del mercado |
| `/api/market/exchanges` | Listados de exchanges |
| `/api/market/search` | Buscar monedas |
| `/api/market/compare` | Comparar múltiples monedas |
| `/api/market/history/[coinId]` | Datos históricos de precios |
| `/api/market/ohlc/[coinId]` | Datos de velas OHLC |
| `/api/market/snapshot/[coinId]` | Snapshot en tiempo real de moneda |
| `/api/market/social/[coinId]` | Métricas sociales para moneda |
| `/api/market/tickers/[coinId]` | Pares de trading para moneda |
| `/api/charts` | Datos de gráficos para visualizaciones |

> 💡 Los endpoints de IA requieren `GROQ_API_KEY` (gratis en [console.groq.com](https://console.groq.com/keys))

---

## 🖥️ Páginas de la Aplicación Web

La aplicación web incluye páginas completas para datos de mercado, gestión de portfolio y más:

### Datos de Mercado
| Página | Descripción |
|------|-------------|
| `/markets` | Vista general del mercado con estadísticas globales y tablas de monedas |
| `/markets/trending` | Criptomonedas en tendencia |
| `/markets/gainers` | Monedas con mejor rendimiento (24h) |
| `/markets/losers` | Monedas con peor rendimiento (24h) |
| `/markets/new` | Monedas listadas recientemente |
| `/markets/exchanges` | Rankings de exchanges por volumen |
| `/markets/exchanges/[id]` | Detalles individuales de exchange |
| `/markets/categories` | Categorías del mercado (DeFi, Layer 1, etc.) |
| `/markets/categories/[id]` | Desglose por categoría |

### Detalles de Moneda
| Página | Descripción |
|------|-------------|
| `/coin/[coinId]` | Página completa de moneda con gráficos, estadísticas, noticias |
| `/compare` | Comparar múltiples criptomonedas lado a lado |

### Características de Usuario
| Página | Descripción |
|------|-------------|
| `/portfolio` | Gestión de portfolio con seguimiento de holdings |
| `/watchlist` | Lista de seguimiento con alertas de precio |
| `/settings` | Preferencias de usuario y notificaciones |

---

## SDKs y Componentes

| Paquete | Descripción |
|---------|-------------|
| [React](sdk/react/) | Componentes `<CryptoNews />` listos para usar |
| [TypeScript](sdk/typescript/) | SDK completo de TypeScript |
| [Python](sdk/python/) | Cliente Python sin dependencias |
| [JavaScript](sdk/javascript/) | SDK para navegador y Node.js |
| [Go](sdk/go/) | Biblioteca cliente de Go |
| [PHP](sdk/php/) | SDK PHP |
| [Componentes UI](docs/components.md) | Componentes internos de navegación y búsqueda |

**URL Base:** `https://cryptocurrency.cv`

**Mirror de Respaldo:** `https://nirholas.github.io/free-crypto-news/`

---

## Formato de Respuesta

```json
{
  "articles": [
    {
      "title": "Bitcoin Alcanza Nuevo ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin superó...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "hace 2h"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

## 🤖 Ejemplos de Endpoints IA

**Hacer preguntas sobre noticias cripto:**
```bash
curl "https://cryptocurrency.cv/api/ask?q=What%20is%20happening%20with%20Bitcoin%20today"
```

**Obtener resúmenes potenciados por IA:**
```bash
curl "https://cryptocurrency.cv/api/summarize?limit=5&style=brief"
```

**Resumen diario:**
```bash
curl "https://cryptocurrency.cv/api/digest?period=24h"
```

**Análisis profundo de sentimiento:**
```bash
curl "https://cryptocurrency.cv/api/sentiment?asset=BTC"
```

---

# Ejemplos de Integración

Elige tu plataforma. Copia el código. Despliégalo.

---

## 🐍 Python

**Sin dependencias.** Solo copia el archivo.

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Obtener últimas noticias
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")

# Buscar temas
eth_news = news.search("ethereum,etf", limit=5)

# Noticias DeFi
defi = news.get_defi(5)

# Noticias Bitcoin
btc = news.get_bitcoin(5)

# Breaking (últimas 2 horas)
breaking = news.get_breaking(5)
```

**Una línea:**
```python
import urllib.request, json
news = json.loads(urllib.request.urlopen("https://cryptocurrency.cv/api/news?limit=5").read())
print(news["articles"][0]["title"])
```

---

## 🟨 JavaScript / TypeScript

**Funciona en Node.js y navegadores.**

### SDK TypeScript (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// Respuestas totalmente tipadas
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

### JavaScript Vanilla

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/javascript/crypto-news.js
```

```javascript
import { CryptoNews } from './crypto-news.js';

const news = new CryptoNews();

// Obtener últimas
const articles = await news.getLatest(5);
articles.forEach(a => console.log(`${a.title} - ${a.source}`));

// Buscar
const eth = await news.search("ethereum");

// DeFi / Bitcoin / Breaking
const defi = await news.getDefi(5);
const btc = await news.getBitcoin(5);
const breaking = await news.getBreaking(5);
```

---

# Auto-Hospedaje

## Despliegue con Un Clic

[![Desplegar con Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manual

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Abre http://localhost:3000/api/news

## Variables de Entorno

**Todas las variables de entorno son opcionales.** El proyecto funciona sin configuración.

| Variable | Por Defecto | Descripción |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Habilita resumen IA, clasificación y traducción en tiempo real (40+ idiomas). **¡GRATIS!** Obtén la tuya en [console.groq.com/keys](https://console.groq.com/keys) |

---

# Stack Tecnológico

- **Runtime:** Next.js 14 Edge Functions
- **Hosting:** Capa gratuita de Vercel
- **Datos:** Parsing RSS directo (sin base de datos)
- **Caché:** Caché edge de 5 minutos

---

# Contribuir

¡PRs bienvenidos! Ideas:

- [ ] Más fuentes de noticias (coreano, chino, japonés, español)
- [x] ~~Análisis de sentimiento~~ ✅ Hecho
- [x] ~~Clasificación de temas~~ ✅ Hecho
- [x] ~~Feed WebSocket en tiempo real~~ ✅ Hecho
- [x] ~~Sistema de alertas configurable~~ ✅ Hecho
- [ ] SDKs Rust / Ruby
- [ ] App móvil (React Native)

---

## 🤝 Contribuir

¡Damos la bienvenida a contribuciones! Ya sea:

- 🐛 Corrección de bugs
- ✨ Nuevas características
- 📰 Añadir fuentes de noticias
- 📖 Mejorar documentación
- 🌍 Traducciones

Por favor lee nuestra [**Guía de Contribución**](CONTRIBUTING.md) para empezar.

---

## 📚 Documentación

| Documento | Descripción |
|----------|-------------|
| [Guía del Usuario](docs/USER-GUIDE.md) | Características para usuarios finales, atajos de teclado, PWA |
| [Guía del Desarrollador](docs/DEVELOPER-GUIDE.md) | Arquitectura, componentes, extender la app |
| [Contribuir](CONTRIBUTING.md) | Cómo contribuir |
| [Changelog](CHANGELOG.md) | Historial de versiones |
| [Seguridad](SECURITY.md) | Política de seguridad |

---

# Licencia

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Deja de pagar por APIs de noticias cripto.</b><br>
  <sub>Hecho con 💜 para la comunidad</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>¿Te resultó útil? ¡Dale una estrella!</b> ⭐<br>
  <sub>Ayuda a otros a descubrir este proyecto y mantiene el desarrollo activo</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Estrella en GitHub">
  </a>
</p>

