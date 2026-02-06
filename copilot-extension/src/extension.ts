import * as vscode from 'vscode';

const API_BASE = 'https://cryptocurrency.cv';

interface NewsArticle {
  title: string;
  source: string;
  link: string;
  timeAgo: string;
  sentiment?: string;
}

interface MarketSentiment {
  score: number;
  label: string;
  bullish: number;
  bearish: number;
  neutral: number;
}

// Fetch helper
async function fetchAPI(endpoint: string): Promise<any> {
  const config = vscode.workspace.getConfiguration('cryptonews');
  const baseUrl = config.get<string>('apiUrl') || API_BASE;
  
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Format news for display
function formatNews(articles: NewsArticle[]): string {
  return articles.map((article, i) => {
    const sentiment = article.sentiment === 'bullish' ? '🟢' :
                      article.sentiment === 'bearish' ? '🔴' : '⚪';
    return `${i + 1}. ${sentiment} **${article.title}**\n   📰 ${article.source} • ${article.timeAgo}\n   🔗 [Read more](${article.link})`;
  }).join('\n\n');
}

// Chat participant handler
const chatHandler: vscode.ChatRequestHandler = async (
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> => {
  
  const command = request.command;
  const query = request.prompt.trim();
  
  try {
    // /breaking - Breaking news
    if (command === 'breaking') {
      stream.markdown('📰 **Breaking Crypto News**\n\n');
      
      const data = await fetchAPI('/api/breaking?limit=5');
      const articles = data.articles || [];
      
      if (articles.length === 0) {
        stream.markdown('*No breaking news at the moment.*');
      } else {
        stream.markdown(formatNews(articles));
      }
      
      return { metadata: { command: 'breaking' } };
    }
    
    // /market - Market sentiment
    if (command === 'market') {
      stream.markdown('📊 **Market Sentiment Analysis**\n\n');
      
      const data = await fetchAPI('/api/sentiment');
      const market = data.market as MarketSentiment;
      
      const emoji = market.score > 60 ? '🟢' : market.score < 40 ? '🔴' : '🟡';
      
      stream.markdown(`**Overall Sentiment:** ${emoji} ${market.label} (${market.score}/100)\n\n`);
      stream.markdown(`- 🟢 Bullish: ${market.bullish}%\n`);
      stream.markdown(`- 🔴 Bearish: ${market.bearish}%\n`);
      stream.markdown(`- ⚪ Neutral: ${market.neutral}%\n`);
      
      return { metadata: { command: 'market' } };
    }
    
    // /prices - Current prices
    if (command === 'prices') {
      stream.markdown('💰 **Current Crypto Prices**\n\n');
      
      const data = await fetchAPI('/api/prices');
      const prices = data.prices || {};
      
      stream.markdown('| Coin | Price | 24h Change |\n');
      stream.markdown('|------|-------|------------|\n');
      
      for (const [symbol, info] of Object.entries(prices).slice(0, 10)) {
        const price = info as any;
        const change = price.change24h || 0;
        const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        stream.markdown(`| ${symbol.toUpperCase()} | $${price.usd?.toLocaleString() || 'N/A'} | ${changeEmoji} ${change.toFixed(2)}% |\n`);
      }
      
      return { metadata: { command: 'prices' } };
    }
    
    // /feargreed - Fear & Greed Index
    if (command === 'feargreed') {
      stream.markdown('😱📊 **Fear & Greed Index**\n\n');
      
      const data = await fetchAPI('/api/fear-greed');
      
      const value = data.value || 50;
      const label = data.classification || 'Neutral';
      
      let emoji = '😐';
      if (value < 25) emoji = '😱';
      else if (value < 40) emoji = '😨';
      else if (value < 60) emoji = '😐';
      else if (value < 75) emoji = '😀';
      else emoji = '🤑';
      
      stream.markdown(`**Current Value:** ${emoji} **${value}** - ${label}\n\n`);
      stream.markdown(`\`${'█'.repeat(Math.floor(value / 5))}${'░'.repeat(20 - Math.floor(value / 5))}\` ${value}%\n\n`);
      stream.markdown(`*Updated: ${data.timestamp || 'Recently'}*`);
      
      return { metadata: { command: 'feargreed' } };
    }
    
    // /whale - Whale alerts
    if (command === 'whale') {
      stream.markdown('🐋 **Whale Activity Alerts**\n\n');
      
      const data = await fetchAPI('/api/whales?limit=5');
      const alerts = data.alerts || [];
      
      if (alerts.length === 0) {
        stream.markdown('*No significant whale activity detected.*');
      } else {
        for (const alert of alerts) {
          const emoji = alert.from?.owner?.includes('exchange') ? '📥' : '📤';
          stream.markdown(`${emoji} **${alert.amount?.toLocaleString()} ${alert.symbol}** ($${(alert.usd_value / 1000000).toFixed(1)}M)\n`);
          stream.markdown(`   ${alert.from?.owner || 'Unknown'} → ${alert.to?.owner || 'Unknown'}\n\n`);
        }
      }
      
      return { metadata: { command: 'whale' } };
    }
    
    // /trending - Trending topics
    if (command === 'trending') {
      stream.markdown('🔥 **Trending in Crypto**\n\n');
      
      const data = await fetchAPI('/api/trending');
      const topics = data.topics || [];
      
      for (const topic of topics.slice(0, 10)) {
        stream.markdown(`- **${topic.name}** - ${topic.mentions} mentions ${topic.sentiment === 'bullish' ? '🟢' : topic.sentiment === 'bearish' ? '🔴' : ''}\n`);
      }
      
      return { metadata: { command: 'trending' } };
    }
    
    // Default - General query about crypto news
    stream.markdown('🔍 **Crypto News Search**\n\n');
    
    if (query) {
      const data = await fetchAPI(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const articles = data.articles || [];
      
      if (articles.length === 0) {
        stream.markdown(`*No news found for "${query}"*\n\n`);
      } else {
        stream.markdown(`Found **${data.total || articles.length}** articles:\n\n`);
        stream.markdown(formatNews(articles));
      }
    } else {
      stream.markdown('Try asking about specific topics or use these commands:\n\n');
      stream.markdown('- `/breaking` - Breaking news\n');
      stream.markdown('- `/market` - Market sentiment\n');
      stream.markdown('- `/prices` - Current prices\n');
      stream.markdown('- `/feargreed` - Fear & Greed Index\n');
      stream.markdown('- `/whale` - Whale alerts\n');
      stream.markdown('- `/trending` - Trending topics\n');
    }
    
    return { metadata: { command: 'search' } };
    
  } catch (error: any) {
    stream.markdown(`❌ **Error:** ${error.message}\n\nPlease try again later.`);
    return { metadata: { command, error: true } };
  }
};

export function activate(context: vscode.ExtensionContext) {
  // Register chat participant
  const participant = vscode.chat.createChatParticipant('crypto-news.chat', chatHandler);
  
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png');
  
  context.subscriptions.push(participant);
  
  // Register refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('cryptonews.refresh', async () => {
      vscode.window.showInformationMessage('Crypto news data refreshed!');
    })
  );
  
  // Register dashboard command
  context.subscriptions.push(
    vscode.commands.registerCommand('cryptonews.openDashboard', async () => {
      const panel = vscode.window.createWebviewPanel(
        'cryptoNewsDashboard',
        'Crypto News Dashboard',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      
      panel.webview.html = getDashboardHTML();
    })
  );
  
  console.log('Crypto News Copilot extension activated!');
}

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #fff; }
    h1 { color: #f7931a; }
    .card { background: #2d2d2d; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .bullish { color: #00ff88; }
    .bearish { color: #ff4444; }
    a { color: #58a6ff; }
  </style>
</head>
<body>
  <h1>📰 Crypto News Dashboard</h1>
  <div class="card">
    <p>Use <code>@cryptonews</code> in Copilot Chat to get started!</p>
    <p>Available commands:</p>
    <ul>
      <li><code>/breaking</code> - Breaking news</li>
      <li><code>/market</code> - Market sentiment</li>
      <li><code>/prices</code> - Current prices</li>
      <li><code>/feargreed</code> - Fear & Greed Index</li>
      <li><code>/whale</code> - Whale alerts</li>
      <li><code>/trending</code> - Trending topics</li>
    </ul>
  </div>
  <div class="card">
    <p>Powered by <a href="https://cryptocurrency.cv">Free Crypto News API</a></p>
  </div>
</body>
</html>`;
}

export function deactivate() {}
