# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
Telegram Bot Example

Simple bot that responds to /news commands.
pip install python-telegram-bot
"""

import asyncio
import aiohttp
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

API_BASE = "https://cryptocurrency.cv"
BOT_TOKEN = "YOUR_BOT_TOKEN"  # Get from @BotFather

async def fetch_news(endpoint="/api/news", limit=5):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE}{endpoint}?limit={limit}") as resp:
            return await resp.json()

async def news_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /news command"""
    await update.message.reply_text("📰 Fetching latest crypto news...")
    
    data = await fetch_news("/api/news", 5)
    articles = data.get("articles", [])
    
    if not articles:
        await update.message.reply_text("No news available right now.")
        return
    
    message = "📰 *Latest Crypto News*\n\n"
    for i, article in enumerate(articles, 1):
        message += f"{i}. [{article['title']}]({article['link']})\n"
        message += f"   _{article['source']} • {article['timeAgo']}_\n\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

async def defi_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /defi command"""
    data = await fetch_news("/api/defi", 5)
    articles = data.get("articles", [])
    
    message = "💰 *DeFi News*\n\n"
    for article in articles:
        message += f"• [{article['title']}]({article['link']})\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

async def bitcoin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /bitcoin command"""
    data = await fetch_news("/api/bitcoin", 5)
    articles = data.get("articles", [])
    
    message = "₿ *Bitcoin News*\n\n"
    for article in articles:
        message += f"• [{article['title']}]({article['link']})\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

async def breaking_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /breaking command"""
    data = await fetch_news("/api/breaking", 5)
    articles = data.get("articles", [])
    
    if not articles:
        await update.message.reply_text("🔇 No breaking news in the last 2 hours.")
        return
    
    message = "🚨 *Breaking News*\n\n"
    for article in articles:
        message += f"• [{article['title']}]({article['link']})\n"
        message += f"  _{article['timeAgo']}_\n\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("news", news_command))
    app.add_handler(CommandHandler("defi", defi_command))
    app.add_handler(CommandHandler("bitcoin", bitcoin_command))
    app.add_handler(CommandHandler("breaking", breaking_command))
    
    print("🤖 Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
