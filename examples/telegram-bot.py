# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
Telegram Bot Example — Crypto News Bot

A full-featured Telegram bot for crypto news, market data, and AI insights.

Setup:
    pip install python-telegram-bot aiohttp

    1. Get a bot token from @BotFather on Telegram
    2. Set BOT_TOKEN below or via environment variable
    3. Run: python telegram-bot.py

Commands:
    /news      — Latest crypto news
    /breaking  — Breaking news (last 2 hours)
    /bitcoin   — Bitcoin-specific news
    /defi      — DeFi news
    /market    — Market overview (prices + Fear & Greed)
    /sentiment — Sentiment analysis for an asset
    /ask       — Ask AI a crypto question
    /whale     — Whale alerts
    /trending  — Trending topics
    /signals   — Trading signals
    /gas       — Ethereum gas prices
    /help      — Show available commands
"""

import os
import aiohttp
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

API_BASE = "https://cryptocurrency.cv"
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN")


# ── Helper ────────────────────────────────────────

async def api_fetch(endpoint: str, params: dict | None = None) -> dict | None:
    """Fetch data from the API with error handling."""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{API_BASE}{endpoint}"
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()
    except Exception as e:
        print(f"API error ({endpoint}): {e}")
        return None


def format_articles(articles: list, emoji: str = "📰") -> str:
    """Format a list of articles into a Telegram message."""
    if not articles:
        return "No articles found."

    lines = []
    for i, a in enumerate(articles[:10], 1):
        title = a.get("title", "Untitled")
        link = a.get("link", "")
        source = a.get("source", "")
        time_ago = a.get("timeAgo", "")
        lines.append(f"{i}. [{title}]({link})\n   _{source} • {time_ago}_")

    return "\n\n".join(lines)


# ── Command Handlers ──────────────────────────────

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help — Show all available commands."""
    text = (
        "🤖 *Crypto News Bot*\n\n"
        "Available commands:\n"
        "/news — Latest crypto news\n"
        "/breaking — Breaking news\n"
        "/bitcoin — Bitcoin news\n"
        "/defi — DeFi news\n"
        "/market — Market overview\n"
        "/sentiment `<asset>` — Sentiment analysis\n"
        "/ask `<question>` — Ask AI anything\n"
        "/whale — Whale alerts\n"
        "/trending — Trending topics\n"
        "/signals — Trading signals\n"
        "/gas — Ethereum gas prices\n"
        "/help — This message\n\n"
        "_Powered by cryptocurrency.cv_"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def news_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /news — Get latest crypto news."""
    await update.message.reply_text("📰 Fetching latest news...")
    data = await api_fetch("/api/news", {"limit": "8"})
    articles = data.get("articles", []) if data else []
    msg = f"📰 *Latest Crypto News*\n\n{format_articles(articles)}"
    await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)


async def breaking_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /breaking — Get breaking news."""
    data = await api_fetch("/api/breaking", {"limit": "8"})
    articles = data.get("articles", []) if data else []
    if not articles:
        await update.message.reply_text("🔇 No breaking news in the last 2 hours.")
        return
    msg = f"🚨 *Breaking News*\n\n{format_articles(articles, '🚨')}"
    await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)


async def bitcoin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /bitcoin — Get Bitcoin news."""
    data = await api_fetch("/api/bitcoin", {"limit": "8"})
    articles = data.get("articles", []) if data else []
    msg = f"₿ *Bitcoin News*\n\n{format_articles(articles, '₿')}"
    await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)


async def defi_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /defi — Get DeFi news."""
    data = await api_fetch("/api/defi", {"limit": "8"})
    articles = data.get("articles", []) if data else []
    msg = f"💰 *DeFi News*\n\n{format_articles(articles, '💰')}"
    await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)


async def market_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /market — Get market overview."""
    await update.message.reply_text("💹 Fetching market data...")

    prices = await api_fetch("/api/prices", {"ids": "bitcoin,ethereum,solana", "vs_currencies": "usd"})
    fear_greed = await api_fetch("/api/fear-greed")

    lines = ["💹 *Market Overview*\n"]

    if prices:
        for coin in ["bitcoin", "ethereum", "solana"]:
            emoji = {"bitcoin": "₿", "ethereum": "Ξ", "solana": "◎"}.get(coin, "•")
            price = prices.get(coin, {}).get("usd") or prices.get("prices", {}).get(coin, {}).get("usd")
            if price:
                lines.append(f"{emoji} {coin.title()}: ${price:,.2f}")

    if fear_greed:
        val = fear_greed.get("value", "N/A")
        cls = fear_greed.get("classification", "")
        lines.append(f"\n😱 Fear & Greed: {val} — {cls}")

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def sentiment_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /sentiment <asset> — Get AI sentiment analysis."""
    asset = context.args[0] if context.args else "bitcoin"
    data = await api_fetch("/api/sentiment", {"asset": asset, "period": "24h"})

    if not data:
        await update.message.reply_text(f"Could not fetch sentiment for {asset}.")
        return

    import json
    text = f"📊 *Sentiment: {asset}*\n\n```\n{json.dumps(data, indent=2)[:2000]}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")


async def ask_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /ask <question> — Ask AI a question about crypto."""
    question = " ".join(context.args) if context.args else "What is happening in crypto today?"
    await update.message.reply_text("🤔 Thinking...")

    data = await api_fetch("/api/ask", {"q": question})

    if data and data.get("answer"):
        msg = f"🤖 *AI Answer*\n\n{data['answer'][:3000]}"
    elif data:
        import json
        msg = f"🤖 *AI Answer*\n\n```\n{json.dumps(data, indent=2)[:2000]}\n```"
    else:
        msg = "❌ Could not get an answer. Try again later."

    await update.message.reply_text(msg, parse_mode="Markdown")


async def whale_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /whale — Get whale alerts."""
    data = await api_fetch("/api/whale-alerts")

    if not data:
        await update.message.reply_text("No whale alert data available.")
        return

    import json
    text = f"🐋 *Whale Alerts*\n\n```\n{json.dumps(data, indent=2)[:3000]}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")


async def trending_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /trending — Get trending topics."""
    data = await api_fetch("/api/trending", {"limit": "10", "period": "24h"})

    if not data:
        await update.message.reply_text("No trending data available.")
        return

    import json
    text = f"🔥 *Trending Topics*\n\n```\n{json.dumps(data, indent=2)[:3000]}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")


async def signals_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /signals — Get trading signals."""
    data = await api_fetch("/api/signals")

    if not data:
        await update.message.reply_text("No trading signals available.")
        return

    import json
    text = f"📡 *Trading Signals*\n\n```\n{json.dumps(data, indent=2)[:3000]}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")


async def gas_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /gas — Get Ethereum gas prices."""
    data = await api_fetch("/api/gas")

    if not data:
        await update.message.reply_text("Could not fetch gas data.")
        return

    import json
    text = f"⛽ *Ethereum Gas Prices*\n\n```\n{json.dumps(data, indent=2)[:2000]}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")


# ── Main ──────────────────────────────────────────

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("start", help_command))
    app.add_handler(CommandHandler("news", news_command))
    app.add_handler(CommandHandler("breaking", breaking_command))
    app.add_handler(CommandHandler("bitcoin", bitcoin_command))
    app.add_handler(CommandHandler("defi", defi_command))
    app.add_handler(CommandHandler("market", market_command))
    app.add_handler(CommandHandler("sentiment", sentiment_command))
    app.add_handler(CommandHandler("ask", ask_command))
    app.add_handler(CommandHandler("whale", whale_command))
    app.add_handler(CommandHandler("trending", trending_command))
    app.add_handler(CommandHandler("signals", signals_command))
    app.add_handler(CommandHandler("gas", gas_command))

    print("🤖 Telegram bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
