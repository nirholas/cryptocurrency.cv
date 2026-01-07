/**
 * Crypto News Ticker Widget - Standalone JS
 * 
 * Include this script and call CryptoTicker.init()
 * 
 * @example
 * <div id="crypto-ticker" class="crypto-ticker">
 *   <div class="crypto-ticker-label">📰 CRYPTO</div>
 *   <div class="crypto-ticker-track"></div>
 * </div>
 * <script src="https://nirholas.github.io/free-crypto-news/widget/ticker.js"></script>
 */
(function() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .crypto-ticker {
      --ticker-bg: #0a0a0a;
      --ticker-text: #fafafa;
      --ticker-accent: #f7931a;
      --ticker-muted: #a1a1a1;
      --ticker-border: #262626;
      --ticker-speed: 30s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--ticker-bg);
      border-top: 1px solid var(--ticker-border);
      border-bottom: 1px solid var(--ticker-border);
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    }
    .crypto-ticker-label {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: linear-gradient(90deg, var(--ticker-bg) 80%, transparent);
      padding: 0 1.5rem 0 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      z-index: 10;
      font-weight: 600;
      color: var(--ticker-accent);
    }
    .crypto-ticker-label::after {
      content: '';
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: crypto-ticker-pulse 2s infinite;
    }
    @keyframes crypto-ticker-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .crypto-ticker-track {
      display: inline-flex;
      animation: crypto-ticker-scroll var(--ticker-speed) linear infinite;
      padding: 0.75rem 0;
      padding-left: 140px;
    }
    .crypto-ticker:hover .crypto-ticker-track {
      animation-play-state: paused;
    }
    @keyframes crypto-ticker-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .crypto-ticker-item {
      display: inline-flex;
      align-items: center;
      padding: 0 2rem;
      border-right: 1px solid var(--ticker-border);
    }
    .crypto-ticker-item:last-child { border-right: none; }
    .crypto-ticker-item a {
      color: var(--ticker-text);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .crypto-ticker-item a:hover { color: var(--ticker-accent); }
    .crypto-ticker-source {
      color: var(--ticker-muted);
      font-size: 0.75rem;
      margin-left: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: var(--ticker-border);
      border-radius: 4px;
    }
    .crypto-ticker-time {
      color: var(--ticker-muted);
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    .crypto-ticker.light {
      --ticker-bg: #ffffff;
      --ticker-text: #0a0a0a;
      --ticker-muted: #6b7280;
      --ticker-border: #e5e7eb;
    }
    .crypto-ticker.compact .crypto-ticker-track { padding: 0.5rem 0; }
    .crypto-ticker.compact .crypto-ticker-item a { font-size: 0.8rem; }
    .crypto-ticker-loading {
      padding: 0.75rem 2rem 0.75rem 140px;
      color: var(--ticker-muted);
    }
  `;
  document.head.appendChild(style);

  // Ticker implementation
  window.CryptoTicker = {
    API_BASE: 'https://free-crypto-news.vercel.app',
    
    async init(selector, options = {}) {
      const container = document.querySelector(selector);
      if (!container) return;
      
      const config = {
        limit: options.limit || 15,
        speed: options.speed || 30,
        category: options.category || 'all',
        showSource: options.showSource !== false,
        showTime: options.showTime !== false,
      };
      
      container.style.setProperty('--ticker-speed', config.speed + 's');
      
      // Add loading state
      let track = container.querySelector('.crypto-ticker-track');
      if (!track) {
        track = document.createElement('div');
        track.className = 'crypto-ticker-track';
        container.appendChild(track);
      }
      track.innerHTML = '<div class="crypto-ticker-loading">Loading crypto news...</div>';
      
      try {
        const endpoint = config.category === 'all' ? '/api/news' : '/api/' + config.category;
        const response = await fetch(this.API_BASE + endpoint + '?limit=' + config.limit);
        const data = await response.json();
        this.render(container, data.articles || [], config);
      } catch (error) {
        track.innerHTML = '<div class="crypto-ticker-loading">Failed to load news</div>';
      }
    },
    
    render(container, articles, config) {
      const track = container.querySelector('.crypto-ticker-track');
      if (!track || !articles.length) return;
      
      const items = articles.map(function(article) {
        const title = CryptoTicker.escapeHtml(CryptoTicker.truncate(article.title, 80));
        const link = CryptoTicker.escapeHtml(article.link);
        const source = config.showSource ? '<span class="crypto-ticker-source">' + CryptoTicker.escapeHtml(article.source) + '</span>' : '';
        const time = config.showTime ? '<span class="crypto-ticker-time">' + CryptoTicker.escapeHtml(article.timeAgo) + '</span>' : '';
        return '<div class="crypto-ticker-item"><a href="' + link + '" target="_blank" rel="noopener">' + title + '</a>' + source + time + '</div>';
      }).join('');
      
      track.innerHTML = items + items;
    },
    
    escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    truncate(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  };

  // Auto-init any existing tickers
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.crypto-ticker[data-auto-init]').forEach(function(el) {
      CryptoTicker.init('#' + el.id, {
        limit: parseInt(el.dataset.limit) || 15,
        speed: parseInt(el.dataset.speed) || 30,
        category: el.dataset.category || 'all'
      });
    });
  });
})();
