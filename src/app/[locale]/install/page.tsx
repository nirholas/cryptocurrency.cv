'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const t = useTranslations();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-4xl font-bold mb-4">
          {t('install.title', { defaultValue: 'Install Free Crypto News' })}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('install.subtitle', { defaultValue: 'Get instant access to crypto news on your device' })}
        </p>
      </div>

      {isInstalled ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-500 mb-2">
            {t('install.installed', { defaultValue: 'App Installed!' })}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('install.installedDesc', { defaultValue: 'Free Crypto News is now installed on your device.' })}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {t('install.openApp', { defaultValue: 'Open App' })}
          </Link>
        </div>
      ) : isIOS ? (
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {t('install.iosTitle', { defaultValue: 'Install on iOS' })}
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {t('install.iosStep1Title', { defaultValue: 'Tap the Share button' })}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.iosStep1Desc', { defaultValue: 'Find the share icon (square with arrow) at the bottom of Safari' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {t('install.iosStep2Title', { defaultValue: 'Scroll and tap "Add to Home Screen"' })}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.iosStep2Desc', { defaultValue: 'You may need to scroll down in the share menu to find it' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {t('install.iosStep3Title', { defaultValue: 'Tap "Add"' })}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.iosStep3Desc', { defaultValue: 'Confirm by tapping Add in the top right corner' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : deferredPrompt ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t('install.readyTitle', { defaultValue: 'Ready to Install' })}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('install.readyDesc', { defaultValue: 'Click the button below to install the app on your device.' })}
          </p>
          <button
            onClick={handleInstall}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            <span>📥</span>
            {t('install.installButton', { defaultValue: 'Install App' })}
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t('install.browserTitle', { defaultValue: 'Install from Browser' })}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('install.browserDesc', { defaultValue: 'Use your browser\'s menu to install this app. Look for "Install App" or "Add to Home Screen" option.' })}
          </p>
          <div className="grid gap-4 md:grid-cols-2 text-left">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">🌐 Chrome / Edge</h3>
              <p className="text-sm text-muted-foreground">
                Click the install icon in the address bar or use menu → "Install App"
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">🦊 Firefox</h3>
              <p className="text-sm text-muted-foreground">
                Firefox doesn't support PWA install, but you can bookmark the site
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t('install.featuresTitle', { defaultValue: 'Why Install?' })}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 bg-card border border-border rounded-xl text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">
              {t('install.feature1Title', { defaultValue: 'Lightning Fast' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('install.feature1Desc', { defaultValue: 'Instant loading with offline support' })}
            </p>
          </div>
          <div className="p-6 bg-card border border-border rounded-xl text-center">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="font-semibold mb-2">
              {t('install.feature2Title', { defaultValue: 'Push Notifications' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('install.feature2Desc', { defaultValue: 'Get alerts for breaking crypto news' })}
            </p>
          </div>
          <div className="p-6 bg-card border border-border rounded-xl text-center">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-semibold mb-2">
              {t('install.feature3Title', { defaultValue: 'Home Screen Access' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('install.feature3Desc', { defaultValue: 'One tap access from your device' })}
            </p>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          ← {t('install.backHome', { defaultValue: 'Back to Home' })}
        </Link>
      </div>
    </div>
  );
}
