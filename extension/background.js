// Background service worker for Free Crypto News extension

const API_BASE = 'https://cryptocurrency.cv/api';
const REFRESH_INTERVAL = 5; // minutes

// Set up periodic refresh
chrome.alarms.create('refreshNews', { periodInMinutes: REFRESH_INTERVAL });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshNews') {
    await refreshCache();
  }
});

async function refreshCache() {
  try {
    const endpoints = ['news', 'breaking', 'bitcoin', 'defi'];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${API_BASE}/${endpoint}?limit=15`);
      if (response.ok) {
        const data = await response.json();
        await chrome.storage.local.set({
          [`cache_${endpoint}`]: {
            articles: data.articles || [],
            timestamp: Date.now()
          }
        });
      }
    }
    
    // Check for breaking news
    const breakingResponse = await fetch(`${API_BASE}/breaking?limit=3`);
    if (breakingResponse.ok) {
      const breakingData = await breakingResponse.json();
      const articles = breakingData.articles || [];
      
      if (articles.length > 0) {
        // Get previously notified articles
        const result = await chrome.storage.local.get('notifiedArticles');
        const notified = new Set(result.notifiedArticles || []);
        
        // Find new breaking articles
        const newArticles = articles.filter(a => !notified.has(a.link));
        
        // Send notification for first new article
        if (newArticles.length > 0) {
          const article = newArticles[0];
          
          // Check if notifications are enabled
          const settings = await chrome.storage.local.get('settings');
          if (settings.settings?.notifications !== false) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon-128.png',
              title: '🔴 Breaking Crypto News',
              message: article.title,
              buttons: [{ title: 'Read More' }]
            });
          }
          
          // Mark as notified
          notified.add(article.link);
          await chrome.storage.local.set({
            notifiedArticles: Array.from(notified).slice(-100) // Keep last 100
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh cache:', error);
  }
}

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: 'https://cryptocurrency.cv' });
});

// Initial cache on install
chrome.runtime.onInstalled.addListener(() => {
  refreshCache();
});
