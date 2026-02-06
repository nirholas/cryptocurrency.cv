'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, X, ExternalLink } from 'lucide-react';

interface PushNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: Date;
}

export function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load notification history from localStorage
    const saved = localStorage.getItem('notification-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: PushNotification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive breaking crypto news alerts.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        });

        // Register for push if service worker is available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service Worker ready for push:', registration);
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const showNotification = (title: string, body: string, url?: string) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: url || 'crypto-news',
      requireInteraction: false,
    });

    notification.onclick = () => {
      if (url) {
        window.open(url, '_blank');
      }
      notification.close();
    };

    // Save to history
    const newNotification: PushNotification = {
      id: Date.now().toString(),
      title,
      body,
      url,
      timestamp: new Date(),
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem('notification-history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notification-history');
  };

  // Check for breaking news and show notifications
  useEffect(() => {
    if (permission !== 'granted') return;

    // Check for breaking news periodically
    const checkBreakingNews = async () => {
      try {
        const response = await fetch('/api/news?category=breaking&limit=1');
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
          const article = data.articles[0];
          const lastNotified = localStorage.getItem('last-notified-article');
          
          if (article.url !== lastNotified && article.link !== lastNotified) {
            // New breaking article - show notification
            const articleUrl = article.url || article.link;
            showNotification(
              '🚨 Breaking News',
              article.title,
              articleUrl
            );
            localStorage.setItem('last-notified-article', articleUrl);
          }
        }
      } catch (error) {
        console.error('Failed to check breaking news:', error);
      }
    };

    // Initial check
    checkBreakingNews();
    
    const interval = setInterval(checkBreakingNews, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [permission]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        aria-label="Notifications"
      >
        {permission === 'granted' ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        {notifications.length > 0 && permission === 'granted' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {permission !== 'granted' ? (
              <div className="p-4 text-center">
                <BellOff className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Get notified about breaking crypto news
                </p>
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg text-sm font-medium"
                >
                  Enable Notifications
                </button>
                {permission === 'denied' && (
                  <p className="mt-2 text-xs text-red-500">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {notification.url && (
                          <a
                            href={notification.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-amber-500"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={clearNotifications}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                  >
                    Clear all
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
