# User Guide

Welcome to Free Crypto News! This guide covers everything you need to know to get the most out of the web application as a reader and user.

> **Looking for the API instead?** See the [Quick Start](./QUICKSTART.md) or the [API Reference](./API.md).

## What You Can Do

Free Crypto News gives you:

- 📰 **Read aggregated news** from 200+ professional crypto sources in one place
- 🔍 **Search** across all articles with instant results
- 🌙 **Dark mode** for comfortable reading
- 🔖 **Bookmark** articles to read later (no account needed)
- ⌨️ **Keyboard shortcuts** for power users
- 📱 **Install as an app** on your phone or desktop (PWA)
- 📴 **Read offline** — cached articles work without internet

## Table of Contents

- [Getting Started](#getting-started)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Dark Mode](#dark-mode)
- [Reading Progress](#reading-progress)
- [Search](#search)
- [Bookmarks](#bookmarks)
- [Reading Time Estimates](#reading-time-estimates)
- [PWA Installation](#pwa-installation)
- [Offline Mode](#offline-mode)
- [Tips & Tricks](#tips--tricks)
- [FAQ](#faq)

---

## 🏁 Getting Started

1. **Visit** [cryptocurrency.cv](https://cryptocurrency.cv)
2. **Browse** the latest headlines on the homepage
3. **Filter** by category (Bitcoin, DeFi, Ethereum, NFTs...) using the navigation
4. **Click** any article to read it in the distraction-free reader
5. **Search** for specific topics using `/` or the search icon

That's it — no account needed. Everything works immediately.

---

## ⌨️ Keyboard Shortcuts

Power through news with keyboard navigation. Press `?` anytime to see the shortcuts modal.

### Navigation

| Shortcut | Action |
|----------|--------|
| `j` | Next article |
| `k` | Previous article |
| `Enter` | Open selected article |
| `Escape` | Close modal / Clear selection |

### Quick Access

| Shortcut | Action |
|----------|--------|
| `g` then `h` | Go to Home |
| `g` then `t` | Go to Trending |
| `g` then `s` | Go to Sources |
| `g` then `b` | Go to Bookmarks |

### Actions

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `d` | Toggle dark mode |
| `?` | Show keyboard shortcuts help |

### Tips

- Articles are navigated in visual order (left-to-right, top-to-bottom)
- The currently selected article is highlighted with a ring
- Press `Enter` on a selected article to read it
- Works on homepage, category pages, and search results

---

## 🌙 Dark Mode

Reduce eye strain with our carefully crafted dark theme.

### How to Toggle

1. **Click the moon/sun icon** in the header
2. **Press `d`** on your keyboard
3. **System preference** - automatically follows your OS setting

### Theme Options

- **Light Mode** ☀️ - Clean white background with dark text
- **Dark Mode** 🌙 - Dark background with light text
- **System** 💻 - Automatically matches your device preference

Your preference is saved locally and persists across sessions.

---

## 📊 Reading Progress

When reading an article, a progress bar appears at the top of the page showing how far you've scrolled.

### Features

- **Gradient indicator** - Beautiful blue-to-purple gradient
- **Smooth animation** - Updates as you scroll
- **Non-intrusive** - Only 3px tall, stays out of your way
- **Article pages only** - Appears on `/article/[id]` pages

---

## 🔍 Search

Find exactly what you're looking for with our powerful search.

### Basic Search

1. Click the search icon or press `/`
2. Type your query (e.g., "bitcoin ETF")
3. Results appear as you type

### Search Autocomplete

As you type, you'll see:

- **Real-time suggestions** - Results update after 300ms
- **Keyboard navigation** - Use `↑` `↓` to navigate suggestions
- **Quick select** - Press `Enter` to select highlighted result
- **Source badges** - See which outlet published each article

### Search Tips

- Search multiple terms: `ethereum staking rewards`
- Search by source: Include source name like `coindesk bitcoin`
- Search by topic: `DeFi`, `NFT`, `regulation`, `ETF`

### Advanced Search (API)

For power users, use URL parameters:

```
/search?q=bitcoin&source=coindesk&limit=20
```

---

## 🔖 Bookmarks

Save articles to read later.

### How to Bookmark

1. **Click the bookmark icon** on any article card
2. **Access saved articles** via the Bookmarks page (`g` then `b`)

### Features

- **Local storage** - Bookmarks are saved in your browser
- **No account required** - Works without signing up
- **Persistent** - Survives browser restarts
- **Quick access** - Press `g` then `b` to view all bookmarks

---

## ⏱️ Reading Time Estimates

Every article shows an estimated reading time to help you plan.

### How It Works

- **Word count based** - Assumes 200 words per minute average
- **Color coded badges**:
  - 🟢 Green (1-3 min) - Quick read
  - 🟡 Yellow (4-7 min) - Medium read  
  - 🔴 Red (8+ min) - Long read

### Where It Appears

- Homepage article cards
- Category pages
- Search results
- Article detail pages

---

## 📱 PWA Installation

Install Free Crypto News as an app on your device for the best experience.

### Desktop (Chrome/Edge)

1. Visit the website
2. Click the install icon in the address bar (or menu → "Install Free Crypto News")
3. Click "Install"

### Mobile (iOS)

1. Open in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Mobile (Android)

1. Open in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home Screen" or "Install app"
4. Confirm installation

### Benefits

- **Instant launch** from home screen
- **Full-screen experience** without browser UI
- **Offline access** to cached content
- **Push notifications** (coming soon)

---

## 📴 Offline Mode

Access news even without an internet connection.

### How It Works

1. **Service Worker** caches pages as you browse
2. **Offline page** shows cached content when disconnected
3. **Auto-sync** refreshes content when back online

### Cached Content

- ✅ Recently viewed articles
- ✅ Homepage (cached version)
- ✅ Static assets (images, CSS, JS)
- ❌ New articles (requires connection)
- ❌ Search (requires connection)

### Offline Indicator

When offline, you'll see:
- A banner indicating offline status
- Cached articles remain accessible
- New content loads when reconnected

---

## 💡 Tips & Tricks

### Stay Updated

- **Breaking news banner** — Urgent news appears at the top
- **Trending section** — See what's hot in the last 24h
- **Source variety** — News aggregated from 200+ professional outlets

### Efficient Reading

1. Use `j`/`k` to quickly scan headlines
2. Use reading time badges to prioritize
3. Bookmark long reads for later
4. Use dark mode at night

### Power User Workflow

```
/ → search "ethereum" → j/k to browse → Enter to read → Escape → continue
```

---

## 📱 Mobile

The web app is fully responsive and works great on mobile devices. For the best experience, install it as a PWA (see [PWA Installation](#pwa-installation) above).

For the dedicated mobile app, see the [Mobile App docs](./integrations/mobile.md).

---

## ❓ FAQ

### Q: Do I need an account?
**A:** No! Everything works without signing up. Bookmarks are saved locally in your browser.

### Q: Is there an API?
**A:** Yes! It's 100% free with no API key required. See the [API Reference](API.md) for full details or the [Quick Start](QUICKSTART.md) to get started in 2 minutes.

### Q: How often is news updated?
**A:** Every few minutes. Breaking news appears within minutes of publication.

### Q: Can I filter by source?
**A:** Yes! Click on any source badge or visit the Sources page.

### Q: Does it work on mobile?
**A:** Absolutely! Fully responsive and installable as a PWA.

### Q: Where does the news come from?
**A:** We aggregate from 200+ professional crypto news outlets, including CoinDesk, The Block, Decrypt, Cointelegraph, Bitcoin Magazine, CryptoSlate, and many more. See [Sources](./SOURCES.md) for the full list.

---

## 🆘 Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/nirholas/free-crypto-news/issues)
- **Discussions**: [Ask questions](https://github.com/nirholas/free-crypto-news/discussions)
- **API Docs**: See [API.md](API.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
