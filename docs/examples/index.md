# Examples Overview

Ready-to-use examples for common integrations.

## Frontend Frameworks

Build crypto news apps with popular frameworks.

| Example | Framework | Language |
|---------|-----------|----------|
| [React Components](react.md) | React | TypeScript |
| [Rust Examples](rust.md) | Tokio/Reqwest | Rust |

## Chat Bots

Build bots that deliver crypto news to your community.

| Example | Platform | Language |
|---------|----------|----------|
| [Discord Bot](discord.md) | Discord | JavaScript |
| [Slack Bot](slack.md) | Slack | JavaScript |
| [Telegram Bot](telegram.md) | Telegram | Python |

## AI & LLM

Integrate crypto news into AI workflows.

| Example | Framework | Language |
|---------|-----------|----------|
| [LangChain Tool](langchain.md) | LangChain | Python |

## Quick Start

### Discord Bot

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('interactionCreate', async interaction => {
  if (interaction.commandName === 'news') {
    const res = await fetch('https://cryptocurrency.cv/api/news?limit=5');
    const { articles } = await res.json();
    
    const embed = {
      title: '📰 Latest Crypto News',
      fields: articles.map(a => ({
        name: a.title,
        value: `[Read more](${a.url}) • ${a.source}`
      }))
    };
    
    await interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
```

### Telegram Bot

```python
from telegram import Update
from telegram.ext import Application, CommandHandler
import httpx

async def news(update: Update, context):
    async with httpx.AsyncClient() as client:
        r = await client.get("https://cryptocurrency.cv/api/news?limit=5")
        articles = r.json()["articles"]
    
    message = "📰 *Latest Crypto News*\n\n"
    for a in articles:
        message += f"• [{a['title']}]({a['url']})\n"
    
    await update.message.reply_markdown(message)

app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("news", news))
app.run_polling()
```

### LangChain Tool

```python
from langchain.tools import tool
import requests

@tool
def get_crypto_news(query: str = "") -> str:
    """Get latest cryptocurrency news. Optionally filter by search query."""
    url = "https://cryptocurrency.cv/api/news"
    if query:
        url = f"https://cryptocurrency.cv/api/search?q={query}"
    
    response = requests.get(url)
    articles = response.json()["articles"][:5]
    
    return "\n".join([f"- {a['title']} ({a['source']})" for a in articles])
```
