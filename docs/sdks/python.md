# Python SDK

The Python SDK provides a simple, Pythonic interface to the Free Crypto News API.

## Installation

```bash
pip install fcn-sdk
```

Or install from source:

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/sdk/python
pip install -e .
```

## Quick Start

```python
from fcn_sdk import CryptoNews

# Initialize client (no API key needed!)
client = CryptoNews()

# Get latest news
news = client.get_news(limit=10)
for article in news['articles']:
    print(f"{article['title']} - {article['source']}")

# Search for specific topics
bitcoin_news = client.search("bitcoin etf", limit=5)

# Get DeFi news
defi_news = client.get_defi_news(limit=10)

# Get breaking news (last 2 hours)
breaking = client.get_breaking_news()
```

## API Reference

### CryptoNews Class

```python
class CryptoNews:
    def __init__(self, base_url: str = "https://cryptocurrency.cv")
```

#### Methods

| Method | Description |
|--------|-------------|
| `get_news(limit=10, source=None, category=None)` | Get latest news |
| `search(query, limit=10)` | Search news by keywords |
| `get_defi_news(limit=10)` | Get DeFi-specific news |
| `get_bitcoin_news(limit=10)` | Get Bitcoin-specific news |
| `get_breaking_news(limit=10)` | Get breaking news (last 2h) |
| `get_market_data()` | Get market overview |
| `get_fear_greed_index()` | Get Fear & Greed Index |
| `get_sources()` | List all news sources |

### Category Filter

```python
# Get institutional research
institutional = client.get_news(category="institutional", limit=20)

# Get on-chain analytics news
onchain = client.get_news(category="onchain", limit=10)

# Available categories
categories = client.get_categories()
print(categories)
```

### Translation

```python
# Get news in Spanish
spanish_news = client.get_news(limit=10, lang="es")

# Get news in Japanese
japanese_news = client.get_news(limit=10, lang="ja")

# Supported: en, es, fr, de, it, pt, nl, pl, ru, ar, zh-CN, zh-TW, ja, ko, tr
```

### Async Support

```python
import asyncio
from fcn_sdk import AsyncCryptoNews

async def main():
    client = AsyncCryptoNews()
    
    # Fetch multiple endpoints concurrently
    news, market, fear_greed = await asyncio.gather(
        client.get_news(limit=10),
        client.get_market_data(),
        client.get_fear_greed_index()
    )
    
    print(f"Latest: {news['articles'][0]['title']}")
    print(f"BTC: ${market['bitcoin']['price']:,.0f}")
    print(f"Fear & Greed: {fear_greed['value']}")

asyncio.run(main())
```

## Examples

### Telegram Bot

```python
import telebot
from fcn_sdk import CryptoNews

bot = telebot.TeleBot("YOUR_BOT_TOKEN")
client = CryptoNews()

@bot.message_handler(commands=['news'])
def send_news(message):
    news = client.get_news(limit=5)
    response = "📰 **Latest Crypto News**\n\n"
    for article in news['articles']:
        response += f"• [{article['title']}]({article['link']})\n"
    bot.reply_to(message, response, parse_mode='Markdown')

bot.polling()
```

### Data Analysis with Pandas

```python
import pandas as pd
from fcn_sdk import CryptoNews

client = CryptoNews()

# Fetch news and convert to DataFrame
news = client.get_news(limit=50)
df = pd.DataFrame(news['articles'])

# Analyze by source
source_counts = df['source'].value_counts()
print(source_counts)

# Filter by date
df['pubDate'] = pd.to_datetime(df['pubDate'])
today = df[df['pubDate'].dt.date == pd.Timestamp.today().date()]
```

## Error Handling

```python
from fcn_sdk import CryptoNews, FCNError

client = CryptoNews()

try:
    news = client.get_news(limit=10)
except FCNError as e:
    print(f"API Error: {e.message}")
    print(f"Status Code: {e.status_code}")
```

## Rate Limits

The Free Crypto News API has generous rate limits:

- **No API key required**
- **No hard rate limits** for reasonable usage
- Recommended: Max 60 requests/minute for optimal performance

## Source Code

View the full SDK source on GitHub: [sdk/python](https://github.com/nirholas/free-crypto-news/tree/main/sdk/python)
