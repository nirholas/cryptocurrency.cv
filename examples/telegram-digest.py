#!/usr/bin/env python3
"""
Crypto News Telegram Digest Bot

A Telegram bot that sends scheduled news digests and on-demand news updates.

Features:
- /news - Get latest news
- /bitcoin - Bitcoin-specific news
- /defi - DeFi news
- /breaking - Breaking news
- /trending - Trending topics
- /digest - Full digest with analysis
- /subscribe - Subscribe to daily digests
- /unsubscribe - Unsubscribe from digests

Setup:
1. Create a bot with @BotFather on Telegram
2. Get your bot token
3. Set BOT_TOKEN environment variable
4. Run: python telegram-digest.py

Requirements:
pip install python-telegram-bot aiohttp
"""

import os
import json
import asyncio
import logging
from datetime import datetime, time
from typing import Optional
import aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    JobQueue,
)

# Configuration
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
API_BASE = 'https://cryptocurrency.cv'

# Storage for subscribed users (use database in production)
subscribed_users: dict[int, dict] = {}

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def fetch_news(endpoint: str, limit: int = 5) -> Optional[dict]:
    """Fetch news from API."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{API_BASE}/api/{endpoint}?limit={limit}') as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"API fetch error: {e}")
    return None


def format_article(article: dict, index: int = None) -> str:
    """Format a single article for Telegram."""
    prefix = f"{index}. " if index else "📰 "
    source = article.get('source', 'Unknown')
    title = article.get('title', 'No title')
    link = article.get('link', '')
    time_ago = article.get('timeAgo', '')
    
    return f"{prefix}*{escape_markdown(title)}*\n└ {source} • {time_ago}\n🔗 [Read more]({link})"


def escape_markdown(text: str) -> str:
    """Escape markdown special characters."""
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send welcome message."""
    keyboard = [
        [
            InlineKeyboardButton("📰 Latest News", callback_data='news'),
            InlineKeyboardButton("🔥 Breaking", callback_data='breaking'),
        ],
        [
            InlineKeyboardButton("₿ Bitcoin", callback_data='bitcoin'),
            InlineKeyboardButton("🏦 DeFi", callback_data='defi'),
        ],
        [
            InlineKeyboardButton("📊 Trending", callback_data='trending'),
            InlineKeyboardButton("📋 Full Digest", callback_data='digest'),
        ],
        [
            InlineKeyboardButton("🔔 Subscribe Daily", callback_data='subscribe'),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = """
🚀 *Welcome to Crypto News Bot\\!*

Get real\\-time crypto news from 7 major sources:
• CoinDesk • The Block • Decrypt
• CoinTelegraph • Bitcoin Magazine
• Blockworks • The Defiant

*Commands:*
/news \\- Latest news
/bitcoin \\- Bitcoin news
/defi \\- DeFi news
/breaking \\- Breaking \\(last 2h\\)
/trending \\- Trending topics
/digest \\- Full analysis digest
/subscribe \\- Daily digest
/unsubscribe \\- Stop daily digest

Choose an option below or type a command:
    """
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=reply_markup,
        parse_mode='MarkdownV2'
    )


async def news_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get latest news."""
    await send_news(update, 'news', '📰 Latest Crypto News', 5)


async def bitcoin_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get Bitcoin news."""
    await send_news(update, 'bitcoin', '₿ Bitcoin News', 5)


async def defi_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get DeFi news."""
    await send_news(update, 'defi', '🏦 DeFi News', 5)


async def breaking_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get breaking news."""
    await send_news(update, 'breaking', '🔥 Breaking News', 5)


async def send_news(update: Update, endpoint: str, title: str, limit: int) -> None:
    """Generic news sender."""
    message = update.message or update.callback_query.message
    
    # Send loading message
    loading_msg = await message.reply_text("⏳ Fetching news...")
    
    data = await fetch_news(endpoint, limit)
    
    if not data or not data.get('articles'):
        await loading_msg.edit_text("❌ Failed to fetch news. Try again later.")
        return
    
    articles = data['articles'][:limit]
    
    text = f"*{escape_markdown(title)}*\n\n"
    for i, article in enumerate(articles, 1):
        text += format_article(article, i) + "\n\n"
    
    text += f"_Updated: {datetime.now().strftime('%H:%M UTC')}_"
    
    await loading_msg.edit_text(text, parse_mode='MarkdownV2', disable_web_page_preview=True)


async def trending_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get trending topics."""
    message = update.message or update.callback_query.message
    loading_msg = await message.reply_text("⏳ Analyzing trends...")
    
    data = await fetch_news('trending', 10)
    
    if not data or not data.get('trending'):
        await loading_msg.edit_text("❌ Failed to fetch trends.")
        return
    
    text = "*📊 Trending Crypto Topics \\(24h\\)*\n\n"
    
    for i, topic in enumerate(data['trending'][:10], 1):
        sentiment_emoji = '🟢' if topic.get('sentiment') == 'bullish' else '🔴' if topic.get('sentiment') == 'bearish' else '⚪'
        topic_name = escape_markdown(topic.get('topic', 'Unknown'))
        count = topic.get('count', 0)
        sentiment = topic.get('sentiment', 'neutral')
        
        text += f"{i}\\. {sentiment_emoji} *{topic_name}* \\- {count} mentions \\({sentiment}\\)\n"
    
    text += f"\n_Analyzed {data.get('articlesAnalyzed', 0)} articles_"
    
    await loading_msg.edit_text(text, parse_mode='MarkdownV2')


async def digest_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send full digest with analysis."""
    message = update.message or update.callback_query.message
    loading_msg = await message.reply_text("⏳ Generating digest... This may take a moment.")
    
    # Fetch multiple endpoints
    news_data = await fetch_news('news', 5)
    trending_data = await fetch_news('trending', 5)
    analyze_data = await fetch_news('analyze', 10)
    
    text = "📋 *CRYPTO NEWS DIGEST*\n"
    text += f"_{escape_markdown(datetime.now().strftime('%B %d, %Y'))}_\n\n"
    
    # Market Sentiment
    if analyze_data and analyze_data.get('analysis'):
        analysis = analyze_data['analysis']
        sentiment = analysis.get('overallSentiment', 'neutral')
        breakdown = analysis.get('sentimentBreakdown', {})
        
        sentiment_emoji = '🟢' if sentiment == 'bullish' else '🔴' if sentiment == 'bearish' else '⚪'
        text += f"*Market Sentiment:* {sentiment_emoji} {escape_markdown(sentiment.upper())}\n"
        text += f"Bullish: {breakdown.get('bullish', 0)} \\| Bearish: {breakdown.get('bearish', 0)} \\| Neutral: {breakdown.get('neutral', 0)}\n\n"
    
    # Trending Topics
    if trending_data and trending_data.get('trending'):
        text += "*🔥 Top Trending:*\n"
        for topic in trending_data['trending'][:5]:
            emoji = '🟢' if topic.get('sentiment') == 'bullish' else '🔴' if topic.get('sentiment') == 'bearish' else '⚪'
            text += f"  {emoji} {escape_markdown(topic.get('topic', ''))} \\({topic.get('count', 0)}\\)\n"
        text += "\n"
    
    # Top Headlines
    if news_data and news_data.get('articles'):
        text += "*📰 Top Headlines:*\n\n"
        for i, article in enumerate(news_data['articles'][:5], 1):
            text += format_article(article, i) + "\n\n"
    
    text += "_Powered by Free Crypto News API_"
    
    await loading_msg.edit_text(text, parse_mode='MarkdownV2', disable_web_page_preview=True)


async def subscribe_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Subscribe to daily digests."""
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    if user_id in subscribed_users:
        await update.message.reply_text(
            "✅ You're already subscribed to daily digests\\!\n"
            "Use /unsubscribe to stop receiving them\\.",
            parse_mode='MarkdownV2'
        )
        return
    
    subscribed_users[user_id] = {
        'chat_id': chat_id,
        'subscribed_at': datetime.now().isoformat(),
        'timezone': 'UTC'
    }
    
    await update.message.reply_text(
        "🔔 *Subscribed to Daily Digest\\!*\n\n"
        "You'll receive a news digest every day at 9:00 AM UTC\\.\n"
        "Use /unsubscribe to stop receiving digests\\.",
        parse_mode='MarkdownV2'
    )


async def unsubscribe_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Unsubscribe from daily digests."""
    user_id = update.effective_user.id
    
    if user_id in subscribed_users:
        del subscribed_users[user_id]
        await update.message.reply_text("🔕 Unsubscribed from daily digests\\.", parse_mode='MarkdownV2')
    else:
        await update.message.reply_text("You're not subscribed to daily digests\\.", parse_mode='MarkdownV2')


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle button callbacks."""
    query = update.callback_query
    await query.answer()
    
    action = query.data
    
    if action == 'news':
        await send_news(update, 'news', '📰 Latest Crypto News', 5)
    elif action == 'bitcoin':
        await send_news(update, 'bitcoin', '₿ Bitcoin News', 5)
    elif action == 'defi':
        await send_news(update, 'defi', '🏦 DeFi News', 5)
    elif action == 'breaking':
        await send_news(update, 'breaking', '🔥 Breaking News', 5)
    elif action == 'trending':
        await trending_command(update, context)
    elif action == 'digest':
        await digest_command(update, context)
    elif action == 'subscribe':
        # Simulate message for subscribe
        update.message = query.message
        await subscribe_command(update, context)


async def send_daily_digest(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send daily digest to all subscribers."""
    logger.info(f"Sending daily digest to {len(subscribed_users)} subscribers")
    
    for user_id, user_data in subscribed_users.items():
        try:
            chat_id = user_data['chat_id']
            
            # Fetch digest data
            news_data = await fetch_news('news', 5)
            trending_data = await fetch_news('trending', 5)
            
            text = "🌅 *GOOD MORNING\\! Your Daily Crypto Digest*\n\n"
            
            if trending_data and trending_data.get('trending'):
                text += "*🔥 Today's Hot Topics:*\n"
                for topic in trending_data['trending'][:5]:
                    emoji = '🟢' if topic.get('sentiment') == 'bullish' else '🔴' if topic.get('sentiment') == 'bearish' else '⚪'
                    text += f"  {emoji} {escape_markdown(topic.get('topic', ''))}\n"
                text += "\n"
            
            if news_data and news_data.get('articles'):
                text += "*📰 Headlines:*\n\n"
                for i, article in enumerate(news_data['articles'][:5], 1):
                    text += format_article(article, i) + "\n\n"
            
            text += "_Have a great day\\! 🚀_"
            
            await context.bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode='MarkdownV2',
                disable_web_page_preview=True
            )
            
        except Exception as e:
            logger.error(f"Failed to send digest to {user_id}: {e}")


def main() -> None:
    """Start the bot."""
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print("❌ Please set TELEGRAM_BOT_TOKEN environment variable")
        print("   Get a token from @BotFather on Telegram")
        return
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", start))
    application.add_handler(CommandHandler("news", news_command))
    application.add_handler(CommandHandler("bitcoin", bitcoin_command))
    application.add_handler(CommandHandler("defi", defi_command))
    application.add_handler(CommandHandler("breaking", breaking_command))
    application.add_handler(CommandHandler("trending", trending_command))
    application.add_handler(CommandHandler("digest", digest_command))
    application.add_handler(CommandHandler("subscribe", subscribe_command))
    application.add_handler(CommandHandler("unsubscribe", unsubscribe_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Schedule daily digest at 9:00 AM UTC
    job_queue = application.job_queue
    if job_queue:
        job_queue.run_daily(
            send_daily_digest,
            time=time(hour=9, minute=0),
            name='daily_digest'
        )
    
    # Start bot
    print("🤖 Crypto News Telegram Bot starting...")
    print("   Press Ctrl+C to stop")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
