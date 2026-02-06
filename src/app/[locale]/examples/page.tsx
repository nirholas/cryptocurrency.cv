import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ExamplesContent } from '@/components/ExamplesContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Code Examples - Free Crypto News',
  description: 'Ready-to-use code examples for integrating Free Crypto News API with Discord, Slack, Telegram, LangChain, and more.',
};

// Example code stored as constants
const examples = [
  {
    id: 'curl',
    name: 'cURL / Shell',
    icon: '🐚',
    description: 'Basic shell script using cURL to fetch news',
    language: 'bash',
    filename: 'curl.sh',
    code: `#!/bin/bash
# Free Crypto News API - curl examples
# No API key required!

API="https://cryptocurrency.cv"

echo "📰 Latest News"
curl -s "$API/api/news?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\\n🔍 Search for 'ethereum'"
curl -s "$API/api/search?q=ethereum&limit=3" | jq '.articles[] | {title, source}'

echo -e "\\n💰 DeFi News"
curl -s "$API/api/defi?limit=3" | jq '.articles[] | {title, source}'

echo -e "\\n₿ Bitcoin News"
curl -s "$API/api/bitcoin?limit=3" | jq '.articles[] | {title, source}'

echo -e "\\n🚨 Breaking News"
curl -s "$API/api/breaking?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\\n📡 Sources"
curl -s "$API/api/sources" | jq '.sources[] | {name, status}'`,
  },
  {
    id: 'discord',
    name: 'Discord Bot',
    icon: '🤖',
    description: 'Discord bot that responds to news commands',
    language: 'javascript',
    filename: 'discord-bot.js',
    setup: 'npm install discord.js',
    envVars: ['DISCORD_TOKEN', 'DISCORD_CHANNEL_ID'],
    code: `/**
 * Discord Bot Example
 * 
 * Simple bot that posts crypto news to a channel.
 * npm install discord.js
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const API_BASE = 'https://cryptocurrency.cv';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function fetchNews(endpoint = '/api/news', limit = 5) {
  const res = await fetch(\`\${API_BASE}\${endpoint}?limit=\${limit}\`);
  return res.json();
}

async function postNews(channel) {
  const { articles } = await fetchNews('/api/breaking', 5);
  
  if (articles.length === 0) {
    return channel.send('No breaking news right now! 📰');
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🚨 Breaking Crypto News')
    .setColor(0x00ff00)
    .setTimestamp();
  
  for (const article of articles) {
    embed.addFields({
      name: article.source,
      value: \`[\${article.title}](\${article.link})\\n*\${article.timeAgo}*\`,
    });
  }
  
  return channel.send({ embeds: [embed] });
}

client.on('ready', () => {
  console.log(\`Logged in as \${client.user.tag}\`);
  
  // Post news every hour
  setInterval(async () => {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) await postNews(channel);
  }, 60 * 60 * 1000);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'news') {
    await interaction.deferReply();
    const { articles } = await fetchNews('/api/news', 5);
    
    const embed = new EmbedBuilder()
      .setTitle('📰 Latest Crypto News')
      .setColor(0x0099ff);
    
    for (const article of articles) {
      embed.addFields({
        name: article.source,
        value: \`[\${article.title}](\${article.link})\`,
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);`,
  },
  {
    id: 'slack',
    name: 'Slack Bot',
    icon: '💬',
    description: 'Post crypto news to your Slack workspace',
    language: 'javascript',
    filename: 'slack-bot.js',
    setup: 'npm install @slack/bolt',
    envVars: ['SLACK_WEBHOOK_URL'],
    code: `/**
 * Free Crypto News Slack Bot
 * 
 * Posts crypto news to a Slack channel via webhooks.
 * 100% FREE - no API keys required for the news API!
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const NEWS_API = 'https://cryptocurrency.cv';

async function fetchNews(endpoint = '/api/news', limit = 5) {
  const url = \`\${NEWS_API}\${endpoint}?limit=\${limit}\`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(\`API error: \${response.status}\`);
  return response.json();
}

function formatNewsMessage(articles, title = '📰 Latest Crypto News') {
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true }
    },
    { type: 'divider' }
  ];

  for (const article of articles) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: \`*<\${article.link}|\${article.title}>*\\n_\${article.source}_ • \${article.timeAgo}\`
      }
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🆓 Powered by <https://github.com/nirholas/free-crypto-news|Free Crypto News API>'
        }
      ]
    }
  );

  return { blocks };
}

async function postToSlack(message) {
  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) throw new Error(\`Slack error: \${response.status}\`);
  return true;
}

async function postLatestNews() {
  console.log('📰 Fetching latest news...');
  const data = await fetchNews('/api/news', 5);
  const message = formatNewsMessage(data.articles, '📰 Latest Crypto News');
  await postToSlack(message);
  console.log('✅ Posted latest news to Slack');
}

// Run
postLatestNews().catch(console.error);`,
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    icon: '📱',
    description: 'Telegram bot with news commands',
    language: 'python',
    filename: 'telegram-bot.py',
    setup: 'pip install python-telegram-bot aiohttp',
    envVars: ['TELEGRAM_TOKEN'],
    code: `"""
Telegram Bot Example

Simple bot that responds to /news commands.
pip install python-telegram-bot aiohttp
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
    
    message = "📰 *Latest Crypto News*\\n\\n"
    for i, article in enumerate(articles, 1):
        message += f"{i}. [{article['title']}]({article['link']})\\n"
        message += f"   _{article['source']} • {article['timeAgo']}_\\n\\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

async def defi_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /defi command"""
    data = await fetch_news("/api/defi", 5)
    articles = data.get("articles", [])
    
    message = "💰 *DeFi News*\\n\\n"
    for article in articles:
        message += f"• [{article['title']}]({article['link']})\\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

async def bitcoin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /bitcoin command"""
    data = await fetch_news("/api/bitcoin", 5)
    articles = data.get("articles", [])
    
    message = "₿ *Bitcoin News*\\n\\n"
    for article in articles:
        message += f"• [{article['title']}]({article['link']})\\n"
    
    await update.message.reply_text(message, parse_mode="Markdown")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("news", news_command))
    app.add_handler(CommandHandler("defi", defi_command))
    app.add_handler(CommandHandler("bitcoin", bitcoin_command))
    
    print("🤖 Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()`,
  },
  {
    id: 'langchain',
    name: 'LangChain Tool',
    icon: '🦜',
    description: 'LangChain tool integration for AI agents',
    language: 'python',
    filename: 'langchain-tool.py',
    setup: 'pip install langchain langchain-openai requests',
    envVars: ['OPENAI_API_KEY'],
    code: `"""
LangChain Tool Example

Use crypto news as a tool in your AI agent.
pip install langchain langchain-openai requests
"""

from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
import requests

API_BASE = "https://cryptocurrency.cv"

@tool
def get_crypto_news(limit: int = 5) -> str:
    """Get the latest cryptocurrency news from 130+ sources."""
    response = requests.get(f"{API_BASE}/api/news?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']}, {article['timeAgo']})")
    
    return "\\n".join(result) if result else "No news available."

@tool
def search_crypto_news(keywords: str, limit: int = 5) -> str:
    """Search crypto news by keywords. Use comma-separated terms."""
    response = requests.get(f"{API_BASE}/api/search?q={keywords}&limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\\n".join(result) if result else f"No news found for '{keywords}'."

@tool
def get_defi_news(limit: int = 5) -> str:
    """Get DeFi-specific news about yield farming, DEXs, and protocols."""
    response = requests.get(f"{API_BASE}/api/defi?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\\n".join(result) if result else "No DeFi news available."

@tool  
def get_bitcoin_news(limit: int = 5) -> str:
    """Get Bitcoin-specific news about BTC, mining, Lightning Network."""
    response = requests.get(f"{API_BASE}/api/bitcoin?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\\n".join(result) if result else "No Bitcoin news available."


# Example agent setup
def create_news_agent():
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    tools = [get_crypto_news, search_crypto_news, get_defi_news, get_bitcoin_news]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful crypto news assistant. Use the available tools to fetch real-time news."),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    agent = create_openai_functions_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)


if __name__ == "__main__":
    # Simple test
    print("Testing crypto news tools...\\n")
    print("Latest News:")
    print(get_crypto_news.invoke({"limit": 3}))`,
  },
  {
    id: 'fetch',
    name: 'JavaScript Fetch',
    icon: '🌐',
    description: 'Simple browser/Node.js fetch example',
    language: 'javascript',
    filename: 'fetch-example.js',
    code: `// Free Crypto News API - No API key required!
const API_BASE = 'https://cryptocurrency.cv';

// Get latest news
async function getLatestNews(limit = 10) {
  const response = await fetch(\`\${API_BASE}/api/news?limit=\${limit}\`);
  const data = await response.json();
  return data.articles;
}

// Search for specific topics
async function searchNews(query, limit = 10) {
  const response = await fetch(\`\${API_BASE}/api/search?q=\${encodeURIComponent(query)}&limit=\${limit}\`);
  const data = await response.json();
  return data.articles;
}

// Get Bitcoin news
async function getBitcoinNews(limit = 10) {
  const response = await fetch(\`\${API_BASE}/api/bitcoin?limit=\${limit}\`);
  const data = await response.json();
  return data.articles;
}

// Get DeFi news
async function getDefiNews(limit = 10) {
  const response = await fetch(\`\${API_BASE}/api/defi?limit=\${limit}\`);
  const data = await response.json();
  return data.articles;
}

// Get breaking news (last 2 hours)
async function getBreakingNews(limit = 10) {
  const response = await fetch(\`\${API_BASE}/api/breaking?limit=\${limit}\`);
  const data = await response.json();
  return data.articles;
}

// Example usage
(async () => {
  const news = await getLatestNews(5);
  console.log('Latest Crypto News:');
  news.forEach((article, i) => {
    console.log(\`\${i + 1}. \${article.title} (\${article.source})\`);
  });
})();`,
  },
  {
    id: 'python',
    name: 'Python Requests',
    icon: '🐍',
    description: 'Simple Python requests example',
    language: 'python',
    filename: 'example.py',
    setup: 'pip install requests',
    code: `"""
Free Crypto News API - Python Example
No API key required!
"""

import requests

API_BASE = "https://cryptocurrency.cv"

def get_latest_news(limit=10):
    """Get latest crypto news"""
    response = requests.get(f"{API_BASE}/api/news", params={"limit": limit})
    return response.json()["articles"]

def search_news(query, limit=10):
    """Search for specific topics"""
    response = requests.get(f"{API_BASE}/api/search", params={"q": query, "limit": limit})
    return response.json()["articles"]

def get_bitcoin_news(limit=10):
    """Get Bitcoin-specific news"""
    response = requests.get(f"{API_BASE}/api/bitcoin", params={"limit": limit})
    return response.json()["articles"]

def get_defi_news(limit=10):
    """Get DeFi news"""
    response = requests.get(f"{API_BASE}/api/defi", params={"limit": limit})
    return response.json()["articles"]

def get_breaking_news(limit=10):
    """Get breaking news from last 2 hours"""
    response = requests.get(f"{API_BASE}/api/breaking", params={"limit": limit})
    return response.json()["articles"]


if __name__ == "__main__":
    print("📰 Latest Crypto News\\n")
    
    news = get_latest_news(5)
    for i, article in enumerate(news, 1):
        print(f"{i}. {article['title']}")
        print(f"   Source: {article['source']} | {article['timeAgo']}")
        print()`,
  },
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-5 py-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">📚 Code Examples</h1>
            <p className="text-gray-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Ready-to-use code examples for integrating the Free Crypto News API. 
              No API keys required — just copy, paste, and run!
            </p>
          </div>
          
          <ExamplesContent examples={examples} />
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
