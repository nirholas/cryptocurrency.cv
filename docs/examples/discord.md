# Discord Bot Example

Build a Discord bot that posts crypto news to your server.

## Features

- 📰 Latest news command
- 🔍 Search functionality
- 💰 Price checks
- 📊 Market sentiment
- 🔔 Breaking news alerts

## Prerequisites

- Node.js 18+
- Discord bot token ([create one here](https://discord.com/developers/applications))
- A Discord server where you can add the bot

## Quick Start

### 1. Create Bot Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it "Crypto News Bot"
4. Go to **Bot** → **Add Bot**
5. Copy the bot token
6. Enable **Message Content Intent**

### 2. Install Dependencies

```bash
npm install discord.js
```

### 3. Create the Bot

```javascript
// discord-bot.js
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_BASE = 'https://cryptocurrency.cv/api';

// Fetch news from API
async function getNews(limit = 5, category = null) {
  const url = category 
    ? `${API_BASE}/news?limit=${limit}&category=${category}`
    : `${API_BASE}/news?limit=${limit}`;
  const response = await fetch(url);
  return response.json();
}

// Search news
async function searchNews(query, limit = 5) {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.json();
}

// Get Fear & Greed Index
async function getFearGreed() {
  const response = await fetch(`${API_BASE}/fear-greed`);
  return response.json();
}

// Create news embed
function createNewsEmbed(articles, title = '📰 Latest Crypto News') {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x5865F2)
    .setTimestamp();

  articles.slice(0, 10).forEach(article => {
    embed.addFields({
      name: article.source,
      value: `[${article.title}](${article.link})\n*${article.timeAgo}*`,
      inline: false,
    });
  });

  return embed;
}

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // !news command
  if (content.startsWith('!news')) {
    const args = content.split(' ').slice(1);
    const category = args[0] || null;
    
    try {
      const data = await getNews(5, category);
      const embed = createNewsEmbed(data.articles);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Failed to fetch news.');
    }
  }

  // !search command
  if (content.startsWith('!search ')) {
    const query = content.slice(8);
    
    try {
      const data = await searchNews(query);
      const embed = createNewsEmbed(data.articles, `🔍 Results for "${query}"`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Search failed.');
    }
  }

  // !fear command
  if (content === '!fear') {
    try {
      const data = await getFearGreed();
      const embed = new EmbedBuilder()
        .setTitle('📊 Fear & Greed Index')
        .setColor(data.value < 25 ? 0xFF0000 : data.value > 75 ? 0x00FF00 : 0xFFFF00)
        .addFields(
          { name: 'Value', value: `${data.value}`, inline: true },
          { name: 'Classification', value: data.classification, inline: true },
        )
        .setTimestamp();
      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Failed to fetch Fear & Greed Index.');
    }
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
```

### 4. Run the Bot

```bash
DISCORD_TOKEN=your_token_here node discord-bot.js
```

## Slash Commands

For a more modern experience, use slash commands:

```javascript
import { SlashCommandBuilder, REST, Routes } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('news')
    .setDescription('Get latest crypto news')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('News category')
        .addChoices(
          { name: 'DeFi', value: 'defi' },
          { name: 'Bitcoin', value: 'bitcoin' },
          { name: 'Institutional', value: 'institutional' },
        )),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search crypto news')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search query')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('fear')
    .setDescription('Get Fear & Greed Index'),
];

// Register commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
await rest.put(
  Routes.applicationCommands(CLIENT_ID),
  { body: commands },
);
```

## Breaking News Alerts

Post breaking news automatically:

```javascript
const ALERT_CHANNEL_ID = 'your_channel_id';

async function checkBreakingNews() {
  const response = await fetch(`${API_BASE}/breaking?limit=3`);
  const data = await response.json();
  
  // Store seen articles to avoid duplicates
  const seen = new Set(/* load from storage */);
  
  for (const article of data.articles) {
    if (!seen.has(article.link)) {
      const channel = client.channels.cache.get(ALERT_CHANNEL_ID);
      const embed = new EmbedBuilder()
        .setTitle('🚨 Breaking News')
        .setDescription(`[${article.title}](${article.link})`)
        .setColor(0xFF0000)
        .setFooter({ text: article.source })
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
      seen.add(article.link);
    }
  }
}

// Check every 5 minutes
setInterval(checkBreakingNews, 5 * 60 * 1000);
```

## Full Example

See the complete Discord bot: [examples/discord-bot.js](https://github.com/nirholas/free-crypto-news/blob/main/examples/discord-bot.js)
