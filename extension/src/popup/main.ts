import './popup.css';
import {
  CATEGORIES,
  TICKER_COINS,
  STORAGE,
  ApiError,
  fetchNews,
  fetchPrices,
  formatChange,
  formatRelativeAge,
  formatUsd,
  isBreaking,
  loadSettings,
  readNewsCache,
  readPricesCache,
  writeNewsCache,
  writePricesCache,
  type NewsArticle,
  type PricesResponse,
  type Settings,
} from '@shared/index';

const ticker = document.getElementById('ticker') as HTMLElement;
const tabs = document.getElementById('tabs') as HTMLElement;
const feed = document.getElementById('feed') as HTMLElement;
const status = document.getElementById('status') as HTMLElement;
const siteLink = document.getElementById('site-link') as HTMLAnchorElement;

let settings: Settings;
let activeCategory = 'all';
let requestToken = 0;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTicker(prices: PricesResponse | undefined, fetchedAt?: number, stale = false): void {
  ticker.replaceChildren();
  for (const coin of TICKER_COINS) {
    const quote = prices?.[coin.id];
    const cell = el('div', 'ticker-coin');
    cell.append(el('span', 'ticker-symbol', coin.symbol));
    if (quote && typeof quote.usd === 'number') {
      cell.append(el('span', 'ticker-price', formatUsd(quote.usd)));
      const change = quote.usd_24h_change;
      const changeEl = el('span', 'ticker-change', formatChange(change));
      if (typeof change === 'number') changeEl.classList.add(change >= 0 ? 'up' : 'down');
      cell.append(changeEl);
      cell.title = `${coin.symbol} ${formatUsd(quote.usd)} (${formatChange(change) || 'no 24h change data'})`;
    } else {
      const placeholder = el('span', 'skeleton-line');
      placeholder.style.width = '60px';
      cell.append(placeholder);
    }
    ticker.append(cell);
  }
  if (stale && fetchedAt) {
    ticker.append(el('div', 'ticker-stale', `Prices from ${formatRelativeAge(fetchedAt)} (offline)`));
  }
}

function renderTabs(): void {
  tabs.replaceChildren();
  for (const category of CATEGORIES) {
    const button = el('button', 'tab', category.label);
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(category.key === activeCategory));
    button.dataset.category = category.key;
    button.addEventListener('click', () => selectCategory(category.key));
    tabs.append(button);
  }
}

function renderSkeleton(): void {
  feed.setAttribute('aria-busy', 'true');
  feed.replaceChildren();
  for (let i = 0; i < 7; i += 1) {
    const row = el('div', 'skeleton');
    row.append(el('div', 'skeleton-line'), el('div', 'skeleton-line short'));
    feed.append(row);
  }
}

function renderArticles(articles: NewsArticle[]): void {
  feed.setAttribute('aria-busy', 'false');
  feed.replaceChildren();
  if (articles.length === 0) {
    renderState(
      'No headlines in this category yet',
      'Sources publish here throughout the day. Try another tab or check back shortly.',
    );
    return;
  }
  articles.forEach((article, index) => {
    const link = el('a', 'article');
    link.href = article.link;
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.animationDelay = `${Math.min(index, 10) * 20}ms`;
    link.append(el('div', 'article-title', article.title));
    const meta = el('div', 'article-meta');
    if (isBreaking(article)) meta.append(el('span', 'badge-breaking', 'Breaking'));
    meta.append(el('span', undefined, article.source));
    meta.append(el('span', undefined, '·'));
    meta.append(el('span', undefined, article.timeAgo));
    link.append(meta);
    feed.append(link);
  });
}

function renderState(title: string, body: string, action?: { label: string; onClick: () => void }): void {
  feed.setAttribute('aria-busy', 'false');
  feed.replaceChildren();
  const box = el('div', 'state');
  box.append(el('h2', undefined, title), el('p', undefined, body));
  if (action) {
    const button = el('button', 'button', action.label);
    button.type = 'button';
    button.addEventListener('click', action.onClick);
    box.append(button);
  }
  feed.append(box);
}

function describeError(error: unknown): { title: string; body: string } {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const wait = error.retryAfterSeconds ? ` Try again in about ${Math.ceil(error.retryAfterSeconds / 60)} min.` : '';
      return { title: 'Rate limit reached', body: `The public API allows 120 requests per hour.${wait}` };
    }
    if (error.status >= 500) {
      return { title: 'cryptocurrency.cv is having trouble', body: 'The API returned a server error. Cached headlines are shown when available.' };
    }
    return { title: 'Request failed', body: `${error.message} (HTTP ${error.status}).` };
  }
  return { title: 'You appear to be offline', body: 'Headlines could not be loaded. Check your connection and retry.' };
}

async function loadCategory(category: string): Promise<void> {
  const token = ++requestToken;
  const cache = await readNewsCache();
  const cached = cache[category];
  if (cached) {
    renderArticles(cached.articles);
    status.textContent = `Updated ${formatRelativeAge(cached.fetchedAt)}`;
  } else {
    renderSkeleton();
    status.textContent = 'Loading';
  }
  try {
    const response = await fetchNews(settings.apiBaseUrl, category);
    if (token !== requestToken) return;
    const fetchedAt = Date.now();
    await writeNewsCache(category, { articles: response.articles, fetchedAt });
    renderArticles(response.articles);
    status.textContent = `Updated ${formatRelativeAge(fetchedAt)}`;
  } catch (error) {
    if (token !== requestToken) return;
    const { title, body } = describeError(error);
    if (cached) {
      status.textContent = `${title}. Showing headlines from ${formatRelativeAge(cached.fetchedAt)}.`;
    } else {
      renderState(title, body, { label: 'Retry', onClick: () => void loadCategory(category) });
      status.textContent = '';
    }
  }
}

async function loadPrices(): Promise<void> {
  const cached = await readPricesCache();
  if (cached) renderTicker(cached.prices, cached.fetchedAt);
  else renderTicker(undefined);
  try {
    const prices = await fetchPrices(settings.apiBaseUrl);
    const fetchedAt = Date.now();
    await writePricesCache({ prices, fetchedAt });
    renderTicker(prices, fetchedAt);
  } catch {
    if (cached) renderTicker(cached.prices, cached.fetchedAt, true);
    else renderTicker(undefined);
  }
}

function selectCategory(category: string): void {
  activeCategory = category;
  for (const tab of tabs.querySelectorAll<HTMLButtonElement>('.tab')) {
    tab.setAttribute('aria-selected', String(tab.dataset.category === category));
  }
  void loadCategory(category);
}

function wireKeyboard(): void {
  tabs.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const index = CATEGORIES.findIndex((c) => c.key === activeCategory);
    const next = event.key === 'ArrowRight' ? (index + 1) % CATEGORIES.length : (index - 1 + CATEGORIES.length) % CATEGORIES.length;
    selectCategory(CATEGORIES[next].key);
    tabs.querySelectorAll<HTMLButtonElement>('.tab')[next]?.focus();
    event.preventDefault();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'r' && !event.metaKey && !event.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
      void Promise.all([loadCategory(activeCategory), loadPrices()]);
    }
  });
}

async function clearBadge(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE.unreadBreaking]: 0 });
  await chrome.action.setBadgeText({ text: '' });
}

async function main(): Promise<void> {
  settings = await loadSettings();
  activeCategory = settings.defaultCategory;
  siteLink.href = settings.apiBaseUrl;
  siteLink.textContent = new URL(settings.apiBaseUrl).host;
  document.getElementById('open-options')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
  renderTabs();
  wireKeyboard();
  await Promise.all([loadCategory(activeCategory), loadPrices(), clearBadge()]);
}

void main();
