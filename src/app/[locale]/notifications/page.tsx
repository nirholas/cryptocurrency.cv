'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { usePWA } from '@/components/PWAProvider';
import {
  requestPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getPermissionStatus,
} from '@/lib/client-push-notifications';
import {
  Bell,
  BellOff,
  BellRing,
  Shield,
  Zap,
  TrendingUp,
  Newspaper,
  Clock,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

/* ─── Types ─── */

interface NotificationPreferences {
  breakingNews: boolean;
  priceAlerts: boolean;
  dailyDigest: boolean;
  marketMovers: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:mm"
  quietHoursEnd: string; // "HH:mm"
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
}

const STORAGE_KEY = 'fcn-notification-preferences';

const DEFAULT_PREFS: NotificationPreferences = {
  breakingNews: true,
  priceAlerts: true,
  dailyDigest: false,
  marketMovers: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  channels: {
    inApp: true,
    push: false,
    email: false,
  },
};

/* ─── Page ─── */

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    'default',
  );
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { notificationPermission } = usePWA();

  // Load preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
    setPermissionStatus(getPermissionStatus());
  }, []);

  // Sync PWA permission
  useEffect(() => {
    if (notificationPermission !== 'unsupported') {
      setPermissionStatus(notificationPermission);
    }
  }, [notificationPermission]);

  const savePrefs = useCallback((updated: NotificationPreferences) => {
    setPrefs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const togglePref = useCallback(
    (
      key: keyof Omit<NotificationPreferences, 'quietHoursStart' | 'quietHoursEnd' | 'channels'>,
    ) => {
      const updated = { ...prefs, [key]: !prefs[key] };
      savePrefs(updated);
    },
    [prefs, savePrefs],
  );

  const updateChannel = useCallback(
    (channel: keyof NotificationPreferences['channels'], value: boolean) => {
      const updated = {
        ...prefs,
        channels: { ...prefs.channels, [channel]: value },
      };
      savePrefs(updated);
    },
    [prefs, savePrefs],
  );

  const handleRequestPermission = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        addToast('Push notifications enabled!', 'success');
        const result = await subscribeToPush();
        if (result.success) {
          setPushSubscribed(true);
          updateChannel('push', true);
        }
      } else {
        addToast('Notification permission denied', 'error');
      }
    } catch {
      addToast('Failed to request permission', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, updateChannel]);

  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setPushSubscribed(false);
        updateChannel('push', false);
        addToast('Push notifications disabled', 'info');
      }
    } catch {
      addToast('Failed to unsubscribe', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, updateChannel]);

  return (
    <>
      <Header />
      <main className="container-main min-h-[60vh] py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Bell className="h-6 w-6 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Notification Preferences
              </h1>
              <p className="text-sm text-text-tertiary">
                Manage how and when you receive notifications
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ─── Push Permission Card ─── */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-accent" aria-hidden="true" />
                Push Notification Permission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  {permissionStatus === 'granted' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Notifications enabled
                      </span>
                    </div>
                  ) : permissionStatus === 'denied' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Notifications blocked — update in browser settings
                      </span>
                    </div>
                  ) : permissionStatus === 'unsupported' ? (
                    <div className="flex items-center gap-2">
                      <BellOff
                        className="h-4 w-4 text-text-tertiary"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-text-tertiary">
                        Push notifications not supported in this browser
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-text-secondary">
                      Allow push notifications to stay updated on breaking news
                    </span>
                  )}
                </div>

                {permissionStatus === 'granted' && pushSubscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                    disabled={loading}
                  >
                    <BellOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Disable Push
                  </Button>
                ) : permissionStatus !== 'denied' &&
                  permissionStatus !== 'unsupported' &&
                  isPushSupported() ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRequestPermission}
                    disabled={loading}
                  >
                    <BellRing className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {loading ? 'Requesting...' : 'Enable Push Notifications'}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* ─── Notification Types ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-5 w-5 text-accent" aria-hidden="true" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <ToggleRow
                icon={<Zap className="h-4 w-4 text-red-500" aria-hidden="true" />}
                label="Breaking News"
                description="Get notified when major crypto news breaks"
                enabled={prefs.breakingNews}
                onToggle={() => togglePref('breakingNews')}
              />
              <ToggleRow
                icon={<TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />}
                label="Price Alerts"
                description="Notifications when your price alerts trigger"
                enabled={prefs.priceAlerts}
                onToggle={() => togglePref('priceAlerts')}
              />
              <ToggleRow
                icon={<Newspaper className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                label="Daily Digest"
                description="Daily summary of top crypto news"
                enabled={prefs.dailyDigest}
                onToggle={() => togglePref('dailyDigest')}
              />
              <ToggleRow
                icon={<AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden="true" />}
                label="Market Movers"
                description="Notify when a coin moves >10% in 1 hour"
                enabled={prefs.marketMovers}
                onToggle={() => togglePref('marketMovers')}
              />
            </CardContent>
          </Card>

          {/* ─── Channel Preferences ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5 text-accent" aria-hidden="true" />
                Delivery Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <ToggleRow
                icon={<Monitor className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                label="In-App"
                description="Show in the notification center"
                enabled={prefs.channels.inApp}
                onToggle={() => updateChannel('inApp', !prefs.channels.inApp)}
              />
              <ToggleRow
                icon={<Bell className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
                label="Push Notifications"
                description={
                  permissionStatus === 'granted'
                    ? 'Browser push notifications'
                    : 'Enable push permission above first'
                }
                enabled={prefs.channels.push}
                onToggle={() => {
                  if (permissionStatus === 'granted') {
                    updateChannel('push', !prefs.channels.push);
                  } else {
                    handleRequestPermission();
                  }
                }}
                disabled={permissionStatus !== 'granted'}
              />
              <ToggleRow
                icon={<Mail className="h-4 w-4 text-purple-500" aria-hidden="true" />}
                label="Email"
                description="Receive email digests"
                enabled={prefs.channels.email}
                onToggle={() => {
                  const newVal = !prefs.channels.email;
                  updateChannel('email', newVal);
                  // Persist to server
                  fetch('/api/notifications/preferences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailEnabled: newVal }),
                  }).catch(() => {
                    // revert on failure
                    updateChannel('email', !newVal);
                    addToast('Failed to update email preference', 'error');
                  });
                  if (newVal) {
                    addToast('Email notifications enabled', 'success');
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* ─── Quiet Hours ─── */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="h-5 w-5 text-accent" aria-hidden="true" />
                Quiet Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ToggleRow
                  icon={<Clock className="h-4 w-4 text-violet-500" aria-hidden="true" />}
                  label="Enable Quiet Hours"
                  description="Pause notifications during set times"
                  enabled={prefs.quietHoursEnabled}
                  onToggle={() => togglePref('quietHoursEnabled')}
                />
              </div>

              {prefs.quietHoursEnabled && (
                <div className="mt-4 flex flex-wrap items-center gap-3 pl-8">
                  <div className="flex items-center gap-2">
                    <Moon
                      className="h-4 w-4 text-text-tertiary"
                      aria-hidden="true"
                    />
                    <label className="text-sm text-text-secondary">From</label>
                    <input
                      type="time"
                      value={prefs.quietHoursStart}
                      onChange={(e) => savePrefs({ ...prefs, quietHoursStart: e.target.value })}
                      className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-sm text-text-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                    <label className="text-sm text-text-secondary">To</label>
                    <input
                      type="time"
                      value={prefs.quietHoursEnd}
                      onChange={(e) => savePrefs({ ...prefs, quietHoursEnd: e.target.value })}
                      className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-sm text-text-primary"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ─── Toggle Row Component ─── */

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  disabled = false,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors',
        !disabled && 'hover:bg-surface-secondary',
        disabled && 'opacity-50',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {badge && (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                {badge}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
        </div>
      </div>

      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}: ${enabled ? 'on' : 'off'}`}
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          enabled ? 'bg-accent' : 'bg-border',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-in-out',
            enabled ? 'translate-x-5' : 'translate-x-0.5',
            'mt-0.5',
          )}
        >
          {enabled ? (
            <Check className="h-3 w-3 text-accent" aria-hidden="true" />
          ) : (
            <X className="h-3 w-3 text-text-tertiary" aria-hidden="true" />
          )}
        </span>
      </button>
    </div>
  );
}
