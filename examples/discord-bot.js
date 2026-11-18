/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Discord Bot Example — Crypto News Bot
 *
 * A full-featured Discord bot that provides crypto news, market data,
 * sentiment analysis, and AI-powered insights.
 *
 * Setup:
 *   npm install discord.js
 *   DISCORD_TOKEN=your_token DISCORD_CHANNEL_ID=your_channel node discord-bot.js
 *
 * Slash Commands:
 *   /news         — Latest crypto news
 *   /breaking     — Breaking news (last 2 hours)
 *   /bitcoin      — Bitcoin-specific news
 *   /defi         — DeFi news
 *   /market       — Market overview (prices + Fear & Greed)
 *   /sentiment    — AI sentiment for an asset
 *   /ask          — Ask AI a crypto question
 *   /whale        — Recent whale alerts
 *   /trending     — Trending topics
 *   /signals      — Trading signals
 *   /defisummary  — DeFi TVL, yield & protocol summary
 *   /stablecoins  — Stablecoin market overview
 *   /l2           — Layer 2 project stats
 *   /gas          — Ethereum/chain gas prices
 *   /briefing     — AI flash briefing
 *   /oracle       — AI oracle prediction
 *   /macro        — Macro indicators & Fed data
 *   /funding      — Funding rate dashboard
 *   /nft          — NFT market overview
 *   /unlocks      — Upcoming token unlocks
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const API_BASE = 'https://cryptocurrency.cv';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ── Helpers ──────────────────────────────────────────────

async function apiFetch(endpoint, params = {}) {
  try {
    const url = new URL(`${API_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API error (${endpoint}):`, err.message);
    return null;
  }
}

function truncate(str, len = 256) {
  return str && str.length > len ? str.slice(0, len - 3) + '...' : str || '';
}

// ── News Embed Builder ──────────────────────────────────

function buildNewsEmbed(title, color, articles) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'cryptocurrency.cv — Free Crypto News API' });

  for (const article of (articles || []).slice(0, 10)) {
    embed.addFields({
      name: `${article.source}`,
      value: `[${truncate(article.title, 200)}](${article.link})\n*${article.timeAgo || ''}*`,
    });
  }

  if (!articles || articles.length === 0) {
    embed.setDescription('No articles found.');
  }

  return embed;
}

// ── Command Handlers ─────────────────────────────────────

const commands = {
  async news(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/news', { limit: '8' });
    const embed = buildNewsEmbed('📰 Latest Crypto News', 0x0099ff, data?.articles);
    await interaction.editReply({ embeds: [embed] });
  },

  async breaking(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/breaking', { limit: '8' });
    const embed = buildNewsEmbed('🚨 Breaking News', 0xff0000, data?.articles);
    await interaction.editReply({ embeds: [embed] });
  },

  async bitcoin(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/bitcoin', { limit: '8' });
    const embed = buildNewsEmbed('₿ Bitcoin News', 0xf7931a, data?.articles);
    await interaction.editReply({ embeds: [embed] });
  },

  async defi(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/defi', { limit: '8' });
    const embed = buildNewsEmbed('💰 DeFi News', 0x00ff88, data?.articles);
    await interaction.editReply({ embeds: [embed] });
  },

  async market(interaction) {
    await interaction.deferReply();

    const [prices, fearGreed] = await Promise.all([
      apiFetch('/api/prices', { ids: 'bitcoin,ethereum,solana', vs_currencies: 'usd' }),
      apiFetch('/api/fear-greed'),
    ]);

    const embed = new EmbedBuilder()
      .setTitle('💹 Market Overview')
      .setColor(0x00ff00)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (prices) {
      const fmt = (id) => {
        const p = prices[id]?.usd || prices?.prices?.[id]?.usd;
        return p ? `$${Number(p).toLocaleString()}` : 'N/A';
      };
      embed.addFields(
        { name: '₿ Bitcoin', value: fmt('bitcoin'), inline: true },
        { name: 'Ξ Ethereum', value: fmt('ethereum'), inline: true },
        { name: '◎ Solana', value: fmt('solana'), inline: true },
      );
    }

    if (fearGreed) {
      embed.addFields({
        name: '😱 Fear & Greed',
        value: `${fearGreed.value || 'N/A'} — ${fearGreed.classification || ''}`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async sentiment(interaction) {
    await interaction.deferReply();
    const asset = interaction.options?.getString('asset') || 'bitcoin';
    const data = await apiFetch('/api/sentiment', { asset, period: '24h' });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Sentiment: ${asset}`)
      .setColor(0x9b59b6)
      .setTimestamp();

    if (data) {
      embed.setDescription(JSON.stringify(data, null, 2).slice(0, 2000));
    } else {
      embed.setDescription('Could not fetch sentiment data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async ask(interaction) {
    await interaction.deferReply();
    const question = interaction.options?.getString('question') || 'What is happening in crypto?';
    const data = await apiFetch('/api/ask', { q: question });

    const embed = new EmbedBuilder()
      .setTitle('🤖 AI Answer')
      .setColor(0x3498db)
      .setTimestamp();

    if (data?.answer) {
      embed.setDescription(truncate(data.answer, 2000));
    } else if (data) {
      embed.setDescription(truncate(JSON.stringify(data), 2000));
    } else {
      embed.setDescription('Could not get an answer.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async whale(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/whale-alerts');

    const embed = new EmbedBuilder()
      .setTitle('🐋 Whale Alerts')
      .setColor(0x1abc9c)
      .setTimestamp();

    if (data?.alerts) {
      for (const alert of data.alerts.slice(0, 8)) {
        embed.addFields({
          name: alert.asset || alert.symbol || 'Unknown',
          value: truncate(`${alert.amount || ''} — ${alert.description || alert.type || ''}`, 200),
        });
      }
    } else {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No whale alerts.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async trending(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/trending', { limit: '10', period: '24h' });

    const embed = new EmbedBuilder()
      .setTitle('🔥 Trending Topics')
      .setColor(0xe74c3c)
      .setTimestamp();

    if (data?.topics) {
      for (const topic of data.topics.slice(0, 10)) {
        embed.addFields({
          name: topic.name || topic.topic || 'Topic',
          value: truncate(topic.description || topic.sentiment || `Score: ${topic.score || 'N/A'}`, 200),
        });
      }
    } else {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No trending data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async signals(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/signals');

    const embed = new EmbedBuilder()
      .setTitle('📡 Trading Signals')
      .setColor(0xf39c12)
      .setTimestamp();

    if (data?.signals) {
      for (const signal of data.signals.slice(0, 8)) {
        embed.addFields({
          name: `${signal.asset || signal.symbol || 'N/A'} — ${signal.action || signal.type || ''}`,
          value: truncate(signal.reason || signal.description || `Confidence: ${signal.confidence || 'N/A'}`, 200),
        });
      }
    } else {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No signals available.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async defisummary(interaction) {
    await interaction.deferReply();
    const [summary, yields] = await Promise.all([
      apiFetch('/api/defi/summary'),
      apiFetch('/api/yields/stats'),
    ]);

    const embed = new EmbedBuilder()
      .setTitle('🏦 DeFi Summary')
      .setColor(0x00ff88)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (summary) {
      embed.addFields(
        { name: 'Total TVL', value: `$${((summary.totalTvl || 0) / 1e9).toFixed(2)}B`, inline: true },
        { name: 'Protocols', value: `${summary.protocolCount || 'N/A'}`, inline: true },
        { name: '24h Change', value: `${(summary.tvlChange24h || 0).toFixed(2)}%`, inline: true },
      );
    }
    if (yields) {
      embed.addFields(
        { name: 'Avg Yield', value: `${(yields.avgApy || 0).toFixed(2)}%`, inline: true },
        { name: 'Median Yield', value: `${(yields.medianApy || 0).toFixed(2)}%`, inline: true },
      );
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async stablecoins(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/stablecoins');

    const embed = new EmbedBuilder()
      .setTitle('💵 Stablecoin Market')
      .setColor(0x2ecc71)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    const coins = Array.isArray(data) ? data : data?.stablecoins || [];
    for (const coin of coins.slice(0, 10)) {
      embed.addFields({
        name: coin.name || coin.symbol || 'Unknown',
        value: `Mkt Cap: $${((coin.marketCap || 0) / 1e9).toFixed(2)}B | Price: $${(coin.price || 1).toFixed(4)}`,
      });
    }

    if (coins.length === 0) {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No stablecoin data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async l2(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/l2/projects');

    const embed = new EmbedBuilder()
      .setTitle('🔗 Layer 2 Projects')
      .setColor(0x3498db)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    const projects = Array.isArray(data) ? data : data?.projects || [];
    for (const p of projects.slice(0, 10)) {
      embed.addFields({
        name: p.name || 'Unknown',
        value: `TVL: $${((p.tvl || 0) / 1e9).toFixed(2)}B | Type: ${p.type || 'N/A'} | TPS: ${(p.tps || 0).toFixed(1)}`,
      });
    }

    if (projects.length === 0) {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No L2 data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async gas(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/gas');

    const embed = new EmbedBuilder()
      .setTitle('⛽ Gas Prices')
      .setColor(0xe67e22)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (data) {
      embed.addFields(
        { name: '🐢 Slow', value: `${data.slow || 'N/A'} Gwei`, inline: true },
        { name: '🚶 Standard', value: `${data.standard || 'N/A'} Gwei`, inline: true },
        { name: '🏃 Fast', value: `${data.fast || 'N/A'} Gwei`, inline: true },
        { name: '⚡ Instant', value: `${data.instant || 'N/A'} Gwei`, inline: true },
      );
    } else {
      embed.setDescription('Could not fetch gas data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async briefing(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/ai/flash-briefing');

    const embed = new EmbedBuilder()
      .setTitle('⚡ AI Flash Briefing')
      .setColor(0x9b59b6)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (data?.briefing) {
      embed.setDescription(truncate(data.briefing, 2000));
    } else if (data?.summary) {
      embed.setDescription(truncate(data.summary, 2000));
    } else {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No briefing available.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async oracle(interaction) {
    await interaction.deferReply();
    const asset = interaction.options?.getString('asset') || 'bitcoin';
    const data = await apiFetch('/api/ai/oracle', { asset });

    const embed = new EmbedBuilder()
      .setTitle(`🔮 AI Oracle: ${asset}`)
      .setColor(0x8e44ad)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (data?.prediction) {
      embed.setDescription(truncate(data.prediction, 2000));
      if (data.confidence) {
        embed.addFields({ name: 'Confidence', value: `${data.confidence}`, inline: true });
      }
      if (data.timeframe) {
        embed.addFields({ name: 'Timeframe', value: data.timeframe, inline: true });
      }
    } else {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No oracle data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async macro(interaction) {
    await interaction.deferReply();
    const [indicators, fearGreed] = await Promise.all([
      apiFetch('/api/macro/indicators'),
      apiFetch('/api/fear-greed'),
    ]);

    const embed = new EmbedBuilder()
      .setTitle('🌐 Macro Overview')
      .setColor(0x2c3e50)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (indicators) {
      embed.setDescription(truncate(JSON.stringify(indicators, null, 2), 2000));
    }
    if (fearGreed) {
      embed.addFields({
        name: '😱 Fear & Greed',
        value: `${fearGreed.value || 'N/A'} — ${fearGreed.classification || ''}`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async funding(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/funding/dashboard');

    const embed = new EmbedBuilder()
      .setTitle('📈 Funding Rate Dashboard')
      .setColor(0x27ae60)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (data) {
      embed.setDescription(truncate(JSON.stringify(data, null, 2), 2000));
    } else {
      embed.setDescription('No funding rate data available.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async nft(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/nft/market');

    const embed = new EmbedBuilder()
      .setTitle('🎨 NFT Market')
      .setColor(0xe91e63)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    if (data) {
      embed.addFields(
        { name: '24h Volume', value: `$${((data.totalVolume24h || 0) / 1e6).toFixed(1)}M`, inline: true },
        { name: 'Sales', value: `${(data.totalSales24h || 0).toLocaleString()}`, inline: true },
        { name: 'Avg Price', value: `$${(data.averagePrice || 0).toFixed(2)}`, inline: true },
      );
    } else {
      embed.setDescription('No NFT market data.');
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async unlocks(interaction) {
    await interaction.deferReply();
    const data = await apiFetch('/api/token-unlocks');

    const embed = new EmbedBuilder()
      .setTitle('🔓 Upcoming Token Unlocks')
      .setColor(0xf1c40f)
      .setTimestamp()
      .setFooter({ text: 'cryptocurrency.cv' });

    const unlocks = Array.isArray(data) ? data : data?.unlocks || [];
    for (const u of unlocks.slice(0, 8)) {
      embed.addFields({
        name: u.token || u.symbol || 'Unknown',
        value: `Value: $${((u.valueUsd || 0) / 1e6).toFixed(1)}M | Date: ${u.date || 'N/A'} | Tokens: ${(u.amount || 0).toLocaleString()}`,
      });
    }

    if (unlocks.length === 0) {
      embed.setDescription(data ? JSON.stringify(data).slice(0, 2000) : 'No upcoming unlocks.');
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

// ── Hourly Auto-Post ─────────────────────────────────────

async function autoPostBreaking(channel) {
  const data = await apiFetch('/api/breaking', { limit: '5' });
  if (!data?.articles?.length) return;

  const embed = buildNewsEmbed('🚨 Breaking Crypto News', 0xff0000, data.articles);
  await channel.send({ embeds: [embed] });
}

// ── Bot Events ───────────────────────────────────────────

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Post breaking news every hour
  if (CHANNEL_ID) {
    setInterval(async () => {
      try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) await autoPostBreaking(channel);
      } catch (err) {
        console.error('Auto-post error:', err.message);
      }
    }, 60 * 60 * 1000);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handler = commands[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`Command error (${interaction.commandName}):`, err.message);
      const reply = interaction.deferred
        ? interaction.editReply.bind(interaction)
        : interaction.reply.bind(interaction);
      await reply({ content: '❌ Something went wrong. Try again later.', ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
