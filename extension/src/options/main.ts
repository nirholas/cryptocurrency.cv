import './options.css';
import {
  CATEGORIES,
  DEFAULT_SETTINGS,
  REFRESH_OPTIONS,
  loadSettings,
  normalizeBaseUrl,
  saveSettings,
  type RefreshMinutes,
  type Settings,
} from '@shared/index';

const form = document.getElementById('settings-form') as HTMLFormElement;
const categorySelect = document.getElementById('defaultCategory') as HTMLSelectElement;
const refreshSelect = document.getElementById('refreshMinutes') as HTMLSelectElement;
const notificationsInput = document.getElementById('notificationsEnabled') as HTMLInputElement;
const apiBaseInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLElement;

function showStatus(message: string, kind: 'ok' | 'error'): void {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
}

function fill(settings: Settings): void {
  categorySelect.value = settings.defaultCategory;
  refreshSelect.value = String(settings.refreshMinutes);
  notificationsInput.checked = settings.notificationsEnabled;
  apiBaseInput.value = settings.apiBaseUrl;
}

function readForm(): Settings {
  const refresh = Number(refreshSelect.value) as RefreshMinutes;
  return {
    defaultCategory: categorySelect.value,
    refreshMinutes: REFRESH_OPTIONS.includes(refresh) ? refresh : DEFAULT_SETTINGS.refreshMinutes,
    notificationsEnabled: notificationsInput.checked,
    apiBaseUrl: normalizeBaseUrl(apiBaseInput.value || DEFAULT_SETTINGS.apiBaseUrl),
  };
}

/** A non-default API origin needs a runtime host permission before fetch() will reach it. */
async function ensureHostPermission(apiBaseUrl: string): Promise<boolean> {
  const origin = `${new URL(apiBaseUrl).origin}/*`;
  if (origin === `${new URL(DEFAULT_SETTINGS.apiBaseUrl).origin}/*`) return true;
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return true;
  return chrome.permissions.request({ origins: [origin] });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  let settings: Settings;
  try {
    settings = readForm();
  } catch (error) {
    showStatus((error as Error).message, 'error');
    apiBaseInput.focus();
    return;
  }
  const allowed = await ensureHostPermission(settings.apiBaseUrl);
  if (!allowed) {
    showStatus(`Permission to reach ${new URL(settings.apiBaseUrl).host} was declined. Settings not saved.`, 'error');
    return;
  }
  await saveSettings(settings);
  showStatus('Saved. The background worker picks up the new interval immediately.', 'ok');
});

document.getElementById('reset')?.addEventListener('click', async () => {
  await saveSettings(DEFAULT_SETTINGS);
  fill(DEFAULT_SETTINGS);
  showStatus('Defaults restored.', 'ok');
});

document.getElementById('test-notification')?.addEventListener('click', async () => {
  const granted = await chrome.notifications.getPermissionLevel();
  if (granted !== 'granted') {
    showStatus('Notifications are disabled for this extension in your browser settings.', 'error');
    return;
  }
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: 'Free Crypto News',
    message: 'Breaking-news alerts will look like this.',
  });
  showStatus('Test notification sent.', 'ok');
});

async function main(): Promise<void> {
  for (const category of CATEGORIES) {
    const option = document.createElement('option');
    option.value = category.key;
    option.textContent = category.label;
    categorySelect.append(option);
  }
  fill(await loadSettings());
}

void main();
