/**
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
  const res = await fetch(`${API_BASE}${endpoint}?limit=${limit}`);
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
      value: `[${article.title}](${article.link})\n*${article.timeAgo}*`,
    });
  }
  
  return channel.send({ embeds: [embed] });
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  
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
        value: `[${article.title}](${article.link})`,
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);
