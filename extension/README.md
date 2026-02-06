# Free Crypto News Browser Extension

Get real-time crypto news directly in your browser toolbar.

## Features

- 📰 **Latest News** - Real-time crypto news from 130+ sources
- 🔴 **Breaking News** - Urgent news alerts
- ₿ **Bitcoin Tab** - Bitcoin-specific news
- 🔷 **DeFi Tab** - DeFi-specific news
- 🔔 **Notifications** - Optional breaking news alerts
- 💾 **Offline Cache** - Browse previously loaded news offline

## Installation

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store.

### Manual Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `extension` folder

## Usage

1. Click the extension icon in your toolbar
2. Browse news across different tabs:
   - **Latest** - All recent news
   - **Breaking** - News from the last 2 hours
   - **Bitcoin** - Bitcoin-focused news
   - **DeFi** - DeFi-focused news
3. Click any article to read the full story

## Settings

Click the gear icon or right-click the extension → Options:

- **Breaking News Alerts** - Enable/disable notifications
- **Show Source Badges** - Toggle source labels
- **Compact Mode** - Fit more articles in the popup
- **Clear Cache** - Remove cached data

## Screenshots

![Extension Popup](./screenshots/popup.png)

## Privacy

This extension:
- ✅ Only fetches from `cryptocurrency.cv`
- ✅ Stores cache locally in your browser
- ✅ Does not track you
- ✅ Does not collect any personal data
- ✅ Open source - review the code yourself

## Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Cache news for offline access |
| `alarms` | Periodic background refresh |
| `host_permissions` | Fetch from our API only |

## Development

```bash
# Clone the repo
git clone https://github.com/nirholas/free-crypto-news.git

# Load extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Load unpacked → select extension folder

# Make changes and reload
```

## Firefox

Firefox version coming soon. The extension uses Manifest V3 which Firefox now supports.

## License

MIT
