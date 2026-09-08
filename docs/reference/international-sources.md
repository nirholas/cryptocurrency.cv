# News Sources

> The full list of English and international news sources the API aggregates, the source tier system, the curated homepage feed, and the international/translation endpoints.
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## 🌍 International News Sources

Get crypto news from **75 international sources** across 18 languages — with automatic English translation!

### Supported Sources by Language

| Language           | Count | Sample Sources                                                                                                             |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| 🇨🇳 Chinese (zh)    | 10    | 8BTC, Jinse Finance, Odaily, ChainNews, PANews, TechFlow, BlockBeats, MarsBit, Wu Blockchain, Foresight News               |
| 🇰🇷 Korean (ko)     | 9     | Block Media, TokenPost, CoinDesk Korea, Decenter, Cobak, The B.Chain, Upbit Blog, Blockchain Today Korea, CryptoQuant Blog |
| 🇯🇵 Japanese (ja)   | 6     | CoinPost, CoinDesk Japan, Cointelegraph Japan, btcnews.jp, Crypto Times Japan, CoinJinja                                   |
| 🇧🇷 Portuguese (pt) | 5     | Cointelegraph Brasil, Livecoins, Portal do Bitcoin, BeInCrypto Brasil, Bitcoin Block                                       |
| 🇮🇳 Hindi (hi)      | 5     | CoinSwitch, CoinDCX, WazirX, ZebPay, Crypto News India                                                                     |
| 🇪🇸 Spanish (es)    | 5     | Cointelegraph Español, Diario Bitcoin, CriptoNoticias, BeInCrypto Español, Bitcoiner Today                                 |
| 🇩🇪 German (de)     | 4     | BTC-ECHO, Cointelegraph Deutsch, Coincierge, CryptoMonday                                                                  |
| 🇫🇷 French (fr)     | 4     | Journal du Coin, Cryptonaute, Cointelegraph France, Cryptoast                                                              |
| 🇮🇷 Persian (fa)    | 4     | Arz Digital, Mihan Blockchain, Ramz Arz, Nobitex                                                                           |
| 🇹🇷 Turkish (tr)    | 3     | Cointelegraph Türkçe, Koin Medya, Coinsider                                                                                |
| 🇷🇺 Russian (ru)    | 3     | ForkLog, Cointelegraph Russia, Bits.Media                                                                                  |
| 🇮🇹 Italian (it)    | 3     | Cointelegraph Italia, The Cryptonomist, Criptovalute.it                                                                    |
| 🇮🇩 Indonesian (id) | 3     | Cointelegraph Indonesia, Blockchain Media, Pintu Academy                                                                   |
| 🇻🇳 Vietnamese (vi) | 2     | Tạp chí Bitcoin, Coin68                                                                                                    |
| 🇹🇭 Thai (th)       | 2     | Siam Blockchain, Bitcoin Addict Thailand                                                                                   |
| 🇵🇱 Polish (pl)     | 2     | Kryptowaluty.pl, Bitcoin.pl                                                                                                |
| 🇳🇱 Dutch (nl)      | 2     | Bitcoin Magazine NL, Crypto Insiders                                                                                       |
| 🇸🇦 Arabic (ar)     | 2     | Cointelegraph Arabic, ArabiCrypto                                                                                          |

### Legacy Region View

| Region | Sources |
| 🇰🇷 **Korea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **China** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japan** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Latin America** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Quick Examples

**cURL:**
```bash
# Get latest news
curl "https://cryptocurrency.cv/api/news?limit=10"

# Get Bitcoin sentiment
curl "https://cryptocurrency.cv/api/sentiment?asset=BTC"

# Search articles
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"

# Get international news with translation
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

**Python:**
```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# Get latest news
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# Get Bitcoin sentiment analysis
sentiment = requests.get(f"{BASE_URL}/api/sentiment?asset=BTC").json()
print(f"BTC Sentiment: {sentiment['label']} ({sentiment['score']:.2f})")

# Get Fear & Greed Index
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Market: {fg['classification']} ({fg['value']}/100)")

# Stream real-time updates
import sseclient
response = requests.get(f"{BASE_URL}/api/stream", stream=True)
client = sseclient.SSEClient(response)
for event in client.events():
    print(f"New: {event.data}")
```

**JavaScript:**
```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Get latest news
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// Get AI-powered summary
const summary = await fetch(`${BASE_URL}/api/summarize?style=bullet`).then(r => r.json());
console.log(summary.summary);

// Stream real-time updates
const events = new EventSource(`${BASE_URL}/api/stream`);
events.onmessage = (e) => console.log('New:', JSON.parse(e.data).title);

// Ask questions about crypto news
const answer = await fetch(`${BASE_URL}/api/ask?q=What's happening with Bitcoin?`).then(r => r.json());
console.log(answer.response);
```

📚 **[Full Tutorials & Examples](../tutorials/index.md)** — 19 comprehensive guides covering the 394-endpoint API with complete working code.

### Features

- ✅ **Auto-translation** to English via Groq AI
- ✅ **7-day translation cache** for efficiency
- ✅ **Original + English** text preserved
- ✅ **Rate-limited** (1 req/sec) to respect APIs
- ✅ **Fallback handling** for unavailable sources
- ✅ **Deduplication** across sources

See [API docs](../API.md#get-apinewsinternational) for full details.


---

## Sources

We aggregate from **130+ English outlets + 76 international sources** across 21 categories. Source quality is defined in a single canonical tier system (`src/lib/source-tiers.ts`) used consistently across the feed, RAG re-ranker, and archive reliability tracker.

### Source Tiers

| Tier | Credibility | Reputation | Examples |
|------|-------------|------------|----------|
| **Tier 1** — Mainstream / institutional | 0.88–0.98 | 90–100 | Bloomberg, Reuters, WSJ, FT, CNBC, Forbes |
| **Tier 2** — Premium crypto-native | 0.86–0.95 | 65–90 | CoinDesk, The Block, Blockworks, Decrypt, The Defiant |
| **Tier 3** — Established crypto news | 0.68–0.82 | 60–80 | CoinTelegraph, Bitcoin Magazine, Bitcoinist |
| **Tier 4** — Aggregators & volume | 0.60–0.68 | 50–60 | Crypto.news, AMBCrypto, CryptoPotato |
| **Research** — Institutional & VC | 0.90–0.94 | 70–72 | Messari, Delphi, Paradigm, a16z |
| **Fintech** — Payments (deprioritized) | 0.40–0.50 | 30–35 | Finextra, PYMNTS, Fintech Futures |

### 🏠 Homepage Feed (curated high-signal sources)

The homepage fetches only from a curated subset focused on quality and signal-to-noise:

- **Tier 1 & 2 — Major crypto news**: CoinDesk, The Block, Decrypt, CoinTelegraph, Bitcoin Magazine, Blockworks, The Defiant, Bitcoinist, CryptoSlate, NewsBTC
- **Research & Analysis**: Messari, Glassnode, Delphi Digital, Paradigm, a16z, The Block Research
- **Security**: CertiK, OpenZeppelin, Trail of Bits, Immunefi, samczsun, SlowMist
- **Ethereum & Alt L1s**: Etherscan Blog, NEAR, Cosmos, Avalanche, Sui, Aptos, Cardano, Polkadot
- **Stablecoins**: Circle Blog, Tether News
- **Institutional / VC**: Galaxy Digital, Pantera, Multicoin, Placeholder, Variant, Dragonfly
- **ETF / Asset Managers**: Grayscale, Bitwise, VanEck, CoinShares, ARK, 21Shares, WisdomTree
- **Developer Tools**: Alchemy, Chainlink, Infura, The Graph, Hardhat, Foundry
- **Exchange Blogs**: Coinbase, Binance
- **Mainstream (selected)**: Bloomberg Crypto, Forbes Crypto

All other endpoints (`/api/news`, `/api/search`, category filters, etc.) query the full source list.

