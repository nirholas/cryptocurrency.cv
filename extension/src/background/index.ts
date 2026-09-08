import {
  ALARM_NAME,
  STORAGE,
  fetchNews,
  fetchPrices,
  isBreaking,
  loadSettings,
  readNewsCache,
  writeNewsCache,
  writePricesCache,
  type NewsArticle,
} from '@shared/index';

const MAX_NOTIFICATIONS_PER_POLL = 3;
const SEEN_LINKS_CAP = 500;
const BADGE_COLOR = '#f7931a';

async function scheduleAlarm(): Promise<void> {
  const settings = await loadSettings();
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (existing && existing.periodInMinutes === settings.refreshMinutes) return;
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 0.1,
    periodInMinutes: settings.refreshMinutes,
  });
}

async function readSeenLinks(): Promise<string[]> {
  const stored = await chrome.storage.local.get(STORAGE.seenLinks);
  return (stored[STORAGE.seenLinks] ?? []) as string[];
}

async function bumpBadge(by: number): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE.unreadBreaking);
  const count = ((stored[STORAGE.unreadBreaking] as number | undefined) ?? 0) + by;
  await chrome.storage.local.set({ [STORAGE.unreadBreaking]: count });
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  await chrome.action.setBadgeText({ text: count > 0 ? String(Math.min(count, 99)) : '' });
}

function notify(article: NewsArticle): void {
  chrome.notifications.create(`fcn:${article.link}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: `${article.source}: breaking`,
    message: article.title,
    contextMessage: article.timeAgo,
    priority: 1,
  });
}

/**
 * One poll: refresh the "all" feed and the ticker prices, persist both for the
 * popup, and raise notifications for newly published breaking headlines.
 */
async function poll(): Promise<void> {
  const settings = await loadSettings();
  const [newsResult, pricesResult] = await Promise.allSettled([
    fetchNews(settings.apiBaseUrl, 'all'),
    fetchPrices(settings.apiBaseUrl),
  ]);

  if (pricesResult.status === 'fulfilled') {
    await writePricesCache({ prices: pricesResult.value, fetchedAt: Date.now() });
  }

  if (newsResult.status === 'rejected') {
    await chrome.storage.local.set({
      [STORAGE.lastError]: { at: Date.now(), message: String((newsResult.reason as Error)?.message ?? newsResult.reason) },
    });
    return;
  }

  const articles = newsResult.value.articles;
  await writeNewsCache('all', { articles, fetchedAt: Date.now() });
  await chrome.storage.local.remove(STORAGE.lastError);

  const seen = await readSeenLinks();
  const firstRun = seen.length === 0;
  const seenSet = new Set(seen);
  const fresh = articles.filter((a) => !seenSet.has(a.link));
  const nextSeen = [...fresh.map((a) => a.link), ...seen].slice(0, SEEN_LINKS_CAP);
  await chrome.storage.local.set({ [STORAGE.seenLinks]: nextSeen });

  // The very first poll seeds the seen-list; notifying on the whole backlog would be noise.
  if (firstRun || !settings.notificationsEnabled) return;

  const breaking = fresh.filter(isBreaking).slice(0, MAX_NOTIFICATIONS_PER_POLL);
  if (breaking.length === 0) return;
  breaking.forEach(notify);
  await bumpBadge(breaking.length);
}

chrome.runtime.onInstalled.addListener(() => {
  void scheduleAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  void scheduleAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void poll();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE.settings]) {
    void chrome.alarms.clear(ALARM_NAME).then(scheduleAlarm);
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith('fcn:')) return;
  void chrome.tabs.create({ url: notificationId.slice(4) });
  chrome.notifications.clear(notificationId);
});

// A service worker can be restarted with the alarm already registered; make
// sure a poll happens once per activation so the popup never opens cold.
const alarmsCache = await readNewsCache();
if (!alarmsCache.all) void poll();
void scheduleAlarm();
