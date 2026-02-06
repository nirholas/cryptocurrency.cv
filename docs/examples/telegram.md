# Telegram Bot Example

Build a Telegram bot for crypto news delivery.

## Features

- 📰 Latest news command
- 🔍 Inline search
- 💰 Price checks
- 📊 Market sentiment
- 🔔 Breaking news alerts
- 📅 Scheduled digests

## Prerequisites

- Python 3.9+
- Telegram bot token (from [@BotFather](https://t.me/botfather))

## Quick Start

### 1. Create Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the prompts to name your bot
4. Copy the bot token

### 2. Install Dependencies

```bash
pip install python-telegram-bot httpx
```

### 3. Create the Bot

```python
# telegram-bot.py
import asyncio
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    InlineQueryHandler,
)

API_BASE = "https://cryptocurrency.cv/api"


async def get_news(limit: int = 5, category: str = None) -> dict:
    """Fetch news from API."""
    url = f"{API_BASE}/news?limit={limit}"
    if category:
        url += f"&category={category}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()


async def search_news(query: str, limit: int = 5) -> dict:
    """Search news."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_BASE}/search",
            params={"q": query, "limit": limit}
        )
        return response.json()


async def get_fear_greed() -> dict:
    """Get Fear & Greed Index."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE}/fear-greed")
        return response.json()


def format_news(articles: list) -> str:
    """Format articles for Telegram."""
    lines = ["📰 *Latest Crypto News*\n"]
    for article in articles[:10]:
        title = article["title"].replace("[", "(").replace("]", ")")
        lines.append(f"• [{title}]({article['link']})")
        lines.append(f"  _{article['source']} · {article['timeAgo']}_\n")
    return "\n".join(lines)


# Command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message."""
    keyboard = [
        [InlineKeyboardButton("📰 Latest News", callback_data="news")],
        [InlineKeyboardButton("📊 Fear & Greed", callback_data="fear")],
        [
            InlineKeyboardButton("Bitcoin", callback_data="cat_bitcoin"),
            InlineKeyboardButton("DeFi", callback_data="cat_defi"),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🚀 *Welcome to Crypto News Bot!*\n\n"
        "Commands:\n"
        "/news - Latest crypto news\n"
        "/search <query> - Search news\n"
        "/fear - Fear & Greed Index\n"
        "/bitcoin - Bitcoin news\n"
        "/defi - DeFi news",
        reply_markup=reply_markup,
        parse_mode="Markdown",
    )


async def news(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send latest news."""
    await update.message.reply_text("⏳ Fetching news...")
    
    data = await get_news(limit=5)
    message = format_news(data["articles"])
    
    await update.message.reply_text(
        message,
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )


async def search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Search news."""
    if not context.args:
        await update.message.reply_text("Usage: /search <query>")
        return
    
    query = " ".join(context.args)
    await update.message.reply_text(f"🔍 Searching for '{query}'...")
    
    data = await search_news(query)
    if not data["articles"]:
        await update.message.reply_text("No results found.")
        return
    
    message = format_news(data["articles"])
    await update.message.reply_text(
        message.replace("Latest Crypto News", f"Results for '{query}'"),
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )


async def fear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send Fear & Greed Index."""
    data = await get_fear_greed()
    
    emoji = "😨" if data["value"] < 25 else "🤑" if data["value"] > 75 else "😐"
    
    await update.message.reply_text(
        f"{emoji} *Fear & Greed Index*\n\n"
        f"Value: *{data['value']}*\n"
        f"Classification: *{data['classification']}*",
        parse_mode="Markdown",
    )


async def category_news(update: Update, context: ContextTypes.DEFAULT_TYPE, category: str):
    """Send category-specific news."""
    await update.message.reply_text(f"⏳ Fetching {category} news...")
    
    data = await get_news(limit=5, category=category)
    message = format_news(data["articles"])
    
    await update.message.reply_text(
        message.replace("Latest Crypto News", f"{category.title()} News"),
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )


async def bitcoin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await category_news(update, context, "bitcoin")


async def defi(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await category_news(update, context, "defi")


# Callback query handler
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button presses."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "news":
        data = await get_news(limit=5)
        message = format_news(data["articles"])
        await query.message.reply_text(
            message,
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
    elif query.data == "fear":
        data = await get_fear_greed()
        emoji = "😨" if data["value"] < 25 else "🤑" if data["value"] > 75 else "😐"
        await query.message.reply_text(
            f"{emoji} *Fear & Greed Index*\n\nValue: *{data['value']}*",
            parse_mode="Markdown",
        )
    elif query.data.startswith("cat_"):
        category = query.data.replace("cat_", "")
        data = await get_news(limit=5, category=category)
        message = format_news(data["articles"])
        await query.message.reply_text(
            message,
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )


# Inline query for searching
async def inline_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline queries."""
    query = update.inline_query.query
    if len(query) < 3:
        return
    
    data = await search_news(query, limit=5)
    
    results = []
    for article in data["articles"]:
        results.append(
            InlineQueryResultArticle(
                id=article["link"],
                title=article["title"],
                description=f"{article['source']} · {article['timeAgo']}",
                url=article["link"],
                input_message_content=InputTextMessageContent(
                    f"[{article['title']}]({article['link']})",
                    parse_mode="Markdown",
                ),
            )
        )
    
    await update.inline_query.answer(results)


def main():
    """Start the bot."""
    app = Application.builder().token(os.environ["TELEGRAM_BOT_TOKEN"]).build()
    
    # Add handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("news", news))
    app.add_handler(CommandHandler("search", search))
    app.add_handler(CommandHandler("fear", fear))
    app.add_handler(CommandHandler("bitcoin", bitcoin))
    app.add_handler(CommandHandler("defi", defi))
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(InlineQueryHandler(inline_search))
    
    # Start polling
    app.run_polling()


if __name__ == "__main__":
    import os
    main()
```

### 4. Run the Bot

```bash
TELEGRAM_BOT_TOKEN=your_token_here python telegram-bot.py
```

## Scheduled Digests

```python
from telegram.ext import JobQueue

async def daily_digest(context: ContextTypes.DEFAULT_TYPE):
    """Send daily news digest."""
    data = await get_news(limit=10)
    message = format_news(data["articles"])
    
    await context.bot.send_message(
        chat_id=CHANNEL_ID,
        text=f"☀️ *Daily Crypto Digest*\n\n{message}",
        parse_mode="Markdown",
    )

# Schedule daily at 9 AM UTC
app.job_queue.run_daily(
    daily_digest,
    time=datetime.time(hour=9, minute=0),
)
```

## Full Example

See the complete Telegram bot: [examples/telegram-bot.py](https://github.com/nirholas/free-crypto-news/blob/main/examples/telegram-bot.py)
