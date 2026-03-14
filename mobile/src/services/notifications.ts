/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@crypto_news:push_token';
const NOTIFICATION_PREFS_KEY = '@crypto_news:notification_prefs';

export interface NotificationPrefs {
  breakingNews: boolean;
  priceAlerts: boolean;
  dailyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  breakingNews: true,
  priceAlerts: true,
  dailyDigest: false,
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in Settings to receive breaking news and price alerts.',
      );
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with actual EAS project ID
    });
    const token = tokenData.data;

    // Persist token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('breaking', {
        name: 'Breaking News',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f7931a',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('digest', {
        name: 'Daily Digest',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setNotificationPrefs(
  prefs: Partial<NotificationPrefs>,
): Promise<void> {
  try {
    const current = await getNotificationPrefs();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
  } catch {
    // no-op
  }
}

/**
 * Schedule a local notification (useful for price alerts triggered client-side).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  channelId: string = 'price-alerts',
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null, // Immediate
  });
}

/**
 * Get the count of unread notifications (badge count).
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
