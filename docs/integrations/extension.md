# Browser Extension

The Free Crypto News browser extension brings crypto news directly to your browser.

## Features

- 📰 Latest news in popup
- 🔔 Breaking news notifications
- 📊 Price ticker in toolbar
- 🔍 Quick search
- ⚡ Real-time updates
- 🌙 Dark mode support

## Installation

### Chrome Web Store

1. Visit the [Chrome Web Store](#) *(coming soon)*
2. Click **Add to Chrome**
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download or clone the repository:
   ```bash
   git clone https://github.com/nirholas/free-crypto-news.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (top right toggle)

4. Click **Load unpacked**

5. Select the `extension/` folder

### Firefox

Firefox version coming soon. The extension uses Manifest V3 which Firefox now supports.

## Usage

### Popup

Click the extension icon to open the popup with:

- Latest 10 news articles
- Source and time information
- Quick links to full articles
- Search box for finding specific news

### Notifications

Enable breaking news notifications in options:

1. Click the extension icon
2. Click the ⚙️ settings icon
3. Enable **Breaking News Notifications**
4. Set notification frequency

### Price Ticker

Show current prices in the toolbar:

1. Open extension options
2. Enable **Show Price Ticker**
3. Select coins to display (BTC, ETH, SOL, etc.)

## Options

Access options by:
- Right-clicking the extension icon → **Options**
- Or clicking ⚙️ in the popup

### Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| News Limit | Articles to show | 10 |
| Auto Refresh | Update interval | 5 min |
| Notifications | Breaking news alerts | Off |
| Dark Mode | Match system theme | Auto |
| Price Ticker | Show prices in toolbar | Off |
| Category Filter | Default news category | All |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+C` | Open popup |
| `Ctrl+Shift+C` | Search news |
| `Esc` | Close popup |

Customize shortcuts at `chrome://extensions/shortcuts`

## Permissions

The extension requires minimal permissions:

| Permission | Reason |
|------------|--------|
| `storage` | Save user preferences |
| `notifications` | Breaking news alerts |
| `alarms` | Background refresh |

**No access to browsing data or history.**

## Privacy

- No user data collected
- No tracking or analytics
- All requests go directly to Free Crypto News API
- No third-party services

## Development

### Build from Source

```bash
cd extension
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### Project Structure

```
extension/
├── manifest.json      # Extension manifest
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── options.html       # Options page
├── options.js         # Options logic
├── background.js      # Service worker
├── icons/             # Extension icons
└── styles/            # CSS styles
```

## Troubleshooting

### Extension Not Loading

1. Check that Developer mode is enabled
2. Reload the extension at `chrome://extensions/`
3. Check for errors in the console

### Notifications Not Working

1. Ensure Chrome notifications are allowed
2. Check extension options for notification settings
3. Verify system notification permissions

### News Not Updating

1. Check internet connection
2. Try manually refreshing (click refresh icon in popup)
3. Clear extension cache in options

### Performance Issues

1. Reduce auto-refresh frequency
2. Lower the news limit
3. Disable price ticker if not needed

## Changelog

### v1.0.0
- Initial release
- News popup with 120+ sources
- Breaking news notifications
- Price ticker
- Dark mode support

## Source Code

View the extension source: [extension/](https://github.com/nirholas/free-crypto-news/tree/main/extension)
