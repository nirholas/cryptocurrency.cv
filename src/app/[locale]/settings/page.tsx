'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  DollarSign,
  Bell,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  Clock,
  LineChart,
  CandlestickChart,
  Trash2,
  Download,
  Upload,
  Info,
  Languages,
} from 'lucide-react';

import { useToast } from '@/components/Toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Preferences types
interface UserPreferences {
  currency: 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';
  priceChangePeriod: '1h' | '24h' | '7d';
  defaultChartType: 'line' | 'candlestick';
  defaultTimeRange: '24h' | '7d' | '30d' | '90d';
  notifications: boolean;
  soundEffects: boolean;
  compactView: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  priceChangePeriod: '24h',
  defaultChartType: 'line',
  defaultTimeRange: '7d',
  notifications: true,
  soundEffects: false,
  compactView: false,
};

const STORAGE_KEY = 'crypto-user-preferences';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const { addToast } = useToast();
  
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save preferences
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        console.error('Failed to save preferences');
      }
    }
  }, [preferences, isLoaded]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    addToast({ type: 'success', title: 'Setting saved', duration: 2000 });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        updatePreference('notifications', true);
        addToast({ type: 'success', title: 'Notifications enabled' });
      } else {
        addToast({ type: 'error', title: 'Notification permission denied' });
      }
    }
  };

  const clearAllData = () => {
    if (confirm('This will clear all your local data including watchlist, portfolio, alerts, and preferences. Continue?')) {
      // Clear all crypto-related localStorage items
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('crypto-') || key === STORAGE_KEY
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset preferences
      setPreferences(DEFAULT_PREFERENCES);
      
      addToast({ type: 'success', title: 'All data cleared' });
    }
  };

  const exportAllData = () => {
    const data: Record<string, unknown> = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('crypto-') || key === STORAGE_KEY) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({ type: 'success', title: 'Data exported' });
  };

  const currencies = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'BTC', label: 'Bitcoin', symbol: '₿' },
    { value: 'ETH', label: 'Ethereum', symbol: 'Ξ' },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-gray-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>

        <div className="space-y-6">
          {/* Theme (dark mode only) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('appearance')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('theme')}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dark mode is always enabled.</p>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Compact View</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show more items with less spacing
                  </p>
                </div>
                <button
                  onClick={() => updatePreference('compactView', !preferences.compactView)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.compactView ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.compactView ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Language Selection */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('language')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('selectLanguage')}
                    </p>
                  </div>
                </div>
                <LanguageSwitcher variant="dropdown" />
              </div>
            </div>
          </div>

          {/* Currency & Display */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Display Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {currencies.map(({ value, label, symbol }) => (
                    <button
                      key={value}
                      onClick={() => updatePreference('currency', value as UserPreferences['currency'])}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        preferences.currency === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{symbol}</span>
                      <span className="text-xs text-gray-500">{value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Change Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['1h', '24h', '7d'].map(period => (
                    <button
                      key={period}
                      onClick={() => updatePreference('priceChangePeriod', period as UserPreferences['priceChangePeriod'])}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        preferences.priceChangePeriod === period
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{period}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Chart Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'line', icon: LineChart, label: 'Line' },
                    { value: 'candlestick', icon: CandlestickChart, label: 'Candlestick' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => updatePreference('defaultChartType', value as UserPreferences['defaultChartType'])}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        preferences.defaultChartType === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Time Range
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['24h', '7d', '30d', '90d'].map(range => (
                    <button
                      key={range}
                      onClick={() => updatePreference('defaultTimeRange', range as UserPreferences['defaultTimeRange'])}
                      className={`p-3 rounded-xl border-2 transition-all font-medium ${
                        preferences.defaultTimeRange === range
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Browser Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when price alerts trigger
                    </p>
                  </div>
                </div>
                {notificationPermission === 'granted' ? (
                  <button
                    onClick={() => updatePreference('notifications', !preferences.notifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.notifications ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                ) : (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Enable
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {preferences.soundEffects ? (
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Play sounds for notifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('soundEffects', !preferences.soundEffects)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.soundEffects ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.soundEffects ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data Management
            </h2>
            <div className="space-y-3">
              <button
                onClick={exportAllData}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Export All Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download watchlist, portfolio, alerts, and settings
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={clearAllData}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Clear All Data</p>
                    <p className="text-sm opacity-70">
                      Remove all local data (cannot be undone)
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About
            </h2>
            <div className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="mb-2">
                  Free Crypto News is an open-source cryptocurrency news and market data platform.
                </p>
                <p>
                  All data is stored locally in your browser. No account required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
