🌐 **Idiomas:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 API Free Crypto News

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="Estrelas GitHub"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Licença"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Status CI"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Demo da API Free Crypto News" width="700">
</p>

> ⭐ **Se você achar isso útil, dê uma estrela no repo!** Ajuda outros a descobrir este projeto e motiva o desenvolvimento contínuo.

---
Obtenha notícias cripto em tempo real de 7 fontes principais com uma única chamada de API.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Outros |
|---|---|---|---|
| **Preço** | 🆓 Grátis para sempre | $29-299/mês | Pago |
| **Chave API** | ❌ Não necessária | Necessária | Necessária |
| **Limite de taxa** | Ilimitado* | 100-1000/dia | Limitado |
| **Fontes** | 12 Inglês + 12 Internacional | 1 | Varia |
| **Internacional** | 🌏 KO, ZH, JA, ES + tradução | Não | Não |
| **Auto-hospedagem** | ✅ Um clique | Não | Não |
| **PWA** | ✅ Instalável | Não | Não |
| **MCP** | ✅ Claude + ChatGPT | Não | Não |

---

## 🌍 Fontes de Notícias Internacionais

Obtenha notícias cripto de **75 fontes internacionais** em 18 idiomas — com tradução automática para inglês!

### Fontes Suportadas

| Região | Fontes |
|--------|---------|
| 🇰🇷 **Coreia** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **China** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japão** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **América Latina** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Exemplos Rápidos

```bash
# Obter todas as notícias internacionais
curl "https://cryptocurrency.cv/api/news/international"

# Obter notícias coreanas com tradução para inglês
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Obter notícias da região asiática
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Recursos

- ✅ **Auto-tradução** para inglês via Groq AI
- ✅ **Cache de tradução de 7 dias** para eficiência
- ✅ **Texto original + inglês** preservado
- ✅ **Limite de taxa** (1 req/seg) para respeitar as APIs
- ✅ **Tratamento de fallback** para fontes indisponíveis
- ✅ **Deduplicação** entre fontes

---

## 📱 Aplicativo Web Progressivo (PWA)

Free Crypto News é um **PWA totalmente instalável** que funciona offline!

### Recursos

| Recurso | Descrição |
|---------|-------------|
| 📲 **Instalável** | Adicionar à tela inicial em qualquer dispositivo |
| 📴 **Modo Offline** | Ler notícias em cache sem internet |
| 🔔 **Notificações Push** | Receber alertas de notícias de última hora |
| ⚡ **Ultra Rápido** | Estratégias de cache agressivas |
| 🔄 **Sincronização em Segundo Plano** | Atualizações automáticas ao voltar online |

### Instalar o App

**Desktop (Chrome/Edge):**
1. Visite [cryptocurrency.cv](https://cryptocurrency.cv)
2. Clique no ícone de instalação (⊕) na barra de endereços
3. Clique em "Instalar"

**iOS Safari:**
1. Visite o site no Safari
2. Toque em Compartilhar (📤) → "Adicionar à Tela de Início"

**Android Chrome:**
1. Visite o site
2. Toque no banner de instalação ou Menu → "Instalar app"

---

## Fontes

Agregamos de **7 meios de comunicação confiáveis**:

- 🟠 **CoinDesk** — Notícias cripto gerais
- 🔵 **The Block** — Institucional e pesquisa
- 🟢 **Decrypt** — Web3 e cultura
- 🟡 **CoinTelegraph** — Notícias cripto globais
- 🟤 **Bitcoin Magazine** — Maximalista Bitcoin
- 🟣 **Blockworks** — DeFi e instituições
- 🔴 **The Defiant** — Nativo DeFi

---

## Endpoints

| Endpoint | Descrição |
|----------|-------------|
| `/api/news` | Últimas de todas as fontes |
| `/api/search?q=bitcoin` | Pesquisar por palavras-chave |
| `/api/defi` | Notícias específicas de DeFi |
| `/api/bitcoin` | Notícias específicas de Bitcoin |
| `/api/breaking` | Apenas as últimas 2 horas |
| `/api/trending` | Tópicos em tendência com sentimento |
| `/api/analyze` | Notícias com classificação de tópicos |
| `/api/stats` | Análises e estatísticas |
| `/api/sources` | Listar todas as fontes |
| `/api/health` | Status de saúde da API e feeds |

### 🤖 Endpoints Potencializados por IA (GRÁTIS via Groq)

| Endpoint | Descrição |
|----------|-------------|
| `/api/summarize` | Resumos de IA de artigos |
| `/api/ask?q=...` | Fazer perguntas sobre notícias cripto |
| `/api/digest` | Resumo diário gerado por IA |
| `/api/sentiment` | Análise profunda de sentimento por artigo |
| `/api/entities` | Extrair pessoas, empresas, tickers |
| `/api/narratives` | Identificar narrativas e temas do mercado |
| `/api/signals` | Sinais de trading baseados em notícias (educacional) |

---

## SDKs e Componentes

| Pacote | Descrição |
|---------|-------------|
| [React](sdk/react/) | Componentes `<CryptoNews />` prontos para uso |
| [TypeScript](sdk/typescript/) | SDK TypeScript completo |
| [Python](sdk/python/) | Cliente Python sem dependências |
| [JavaScript](sdk/javascript/) | SDK navegador e Node.js |
| [Go](sdk/go/) | Biblioteca cliente Go |
| [PHP](sdk/php/) | SDK PHP |

**URL Base:** `https://cryptocurrency.cv`

---

## Formato de Resposta

```json
{
  "articles": [
    {
      "title": "Bitcoin Atinge Novo ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin superou...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "há 2h"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# Exemplos de Integração

Escolha sua plataforma. Copie o código. Faça o deploy.

---

## 🐍 Python

**Zero dependências.** Apenas copie o arquivo.

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Obter últimas notícias
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")
```

---

## 🟨 JavaScript / TypeScript

**Funciona em Node.js e navegadores.**

### SDK TypeScript (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// Respostas totalmente tipadas
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

---

# Auto-Hospedagem

## Deploy em Um Clique

[![Deploy com Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manual

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Abra http://localhost:3000/api/news

## Variáveis de Ambiente

**Todas as variáveis de ambiente são opcionais.** O projeto funciona sem configuração.

| Variável | Padrão | Descrição |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Habilita auto-tradução i18n (18 idiomas). **GRÁTIS!** Obtenha a sua em [console.groq.com/keys](https://console.groq.com/keys) |
| `FEATURE_TRANSLATION` | `false` | Definir como `true` para habilitar tradução em tempo real |

---

# Stack Tecnológico

- **Runtime:** Next.js 14 Edge Functions
- **Hospedagem:** Tier gratuito Vercel
- **Dados:** Parsing RSS direto (sem banco de dados)
- **Cache:** Cache edge de 5 minutos

---

# Contribuir

PRs são bem-vindos! Ideias:

- [ ] Mais fontes de notícias
- [x] ~~Análise de sentimento~~ ✅ Feito
- [x] ~~Classificação de tópicos~~ ✅ Feito
- [x] ~~Feed WebSocket em tempo real~~ ✅ Feito
- [ ] SDKs Rust / Ruby
- [ ] App móvel (React Native)

---

## 📚 Documentação

| Documento | Descrição |
|----------|-------------|
| [Guia do Usuário](docs/USER-GUIDE.md) | Recursos para usuários finais, atalhos de teclado, PWA |
| [Guia do Desenvolvedor](docs/DEVELOPER-GUIDE.md) | Arquitetura, componentes, estender o app |
| [Contribuir](CONTRIBUTING.md) | Como contribuir |
| [Changelog](CHANGELOG.md) | Histórico de versões |
| [Segurança](SECURITY.md) | Política de segurança |

---

# Licença

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Pare de pagar por APIs de notícias cripto.</b><br>
  <sub>Feito com 💜 para a comunidade</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Achou útil? Dê uma estrela!</b> ⭐<br>
  <sub>Ajuda outros a descobrir este projeto e mantém o desenvolvimento ativo</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Estrela no GitHub">
  </a>
</p>
