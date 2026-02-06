const API_BASE = 'https://cryptocurrency.cv/api';

let currentEndpoint = 'news';

const sourceClasses = {
  'CoinDesk': 'source-coindesk',
  'The Block': 'source-theblock',
  'Decrypt': 'source-decrypt',
  'CoinTelegraph': 'source-cointelegraph',
  'Bitcoin Magazine': 'source-bitcoinmagazine',
  'Blockworks': 'source-blockworks',
  'The Defiant': 'source-thedefiant',
};

async function fetchNews(endpoint) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading news...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/${endpoint}?limit=15`);
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    const articles = data.articles || [];
    
    if (articles.length === 0) {
      content.innerHTML = '<div class="loading">No articles found</div>';
      return;
    }
    
    content.innerHTML = articles.map(article => {
      const sourceClass = sourceClasses[article.source] || '';
      const isBreaking = endpoint === 'breaking' ? 'breaking' : '';
      
      return `
        <div class="article ${isBreaking}" data-url="${article.link}">
          <span class="article-source ${sourceClass}">${article.source}</span>
          <div class="article-title">${escapeHtml(article.title)}</div>
          <div class="article-meta">${article.timeAgo}</div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.article').forEach(el => {
      el.addEventListener('click', () => {
        chrome.tabs.create({ url: el.dataset.url });
      });
    });
    
    // Update timestamp
    document.getElementById('lastUpdate').textContent = 'Updated just now';
    
    // Save to storage
    chrome.storage.local.set({ 
      [`cache_${endpoint}`]: { articles, timestamp: Date.now() }
    });
    
  } catch (error) {
    content.innerHTML = `<div class="error">Failed to load news<br><small>${error.message}</small></div>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentEndpoint = tab.dataset.endpoint;
    fetchNews(currentEndpoint);
  });
});

// Refresh button
document.getElementById('refresh').addEventListener('click', () => {
  fetchNews(currentEndpoint);
});

// Initial load - try cache first
async function init() {
  const result = await chrome.storage.local.get(`cache_${currentEndpoint}`);
  const cache = result[`cache_${currentEndpoint}`];
  
  // Use cache if less than 5 minutes old
  if (cache && Date.now() - cache.timestamp < 5 * 60 * 1000) {
    const content = document.getElementById('content');
    content.innerHTML = cache.articles.map(article => {
      const sourceClass = sourceClasses[article.source] || '';
      return `
        <div class="article" data-url="${article.link}">
          <span class="article-source ${sourceClass}">${article.source}</span>
          <div class="article-title">${escapeHtml(article.title)}</div>
          <div class="article-meta">${article.timeAgo}</div>
        </div>
      `;
    }).join('');
    
    document.querySelectorAll('.article').forEach(el => {
      el.addEventListener('click', () => {
        chrome.tabs.create({ url: el.dataset.url });
      });
    });
    
    const mins = Math.floor((Date.now() - cache.timestamp) / 60000);
    document.getElementById('lastUpdate').textContent = 
      mins === 0 ? 'Updated just now' : `Updated ${mins}m ago`;
  } else {
    fetchNews(currentEndpoint);
  }
}

init();
