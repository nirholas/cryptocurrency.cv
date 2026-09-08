# Progressive Web App

> The installable PWA: offline support, install prompts, keyboard shortcuts, and the service worker behaviour of the web app.
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## 📱 Progressive Web App (PWA)

Free Crypto News is a **fully installable PWA** that works offline!

### Features

| Feature                   | Description                                     |
| ------------------------- | ----------------------------------------------- |
| 📲 **Installable**        | Add to home screen on any device                |
| 📴 **Offline Mode**       | Read cached news without internet               |
| 🔔 **Push Notifications** | Get breaking news alerts                        |
| ⚡ **Lightning Fast**     | Aggressive caching strategies                   |
| 🔄 **Background Sync**    | Auto-updates when back online                   |
| 🎯 **App Shortcuts**      | Quick access to Latest, Breaking, Bitcoin       |
| 📤 **Share Target**       | Share links directly to the app                 |
| 🚨 **Real-Time Alerts**   | Configurable alerts for price & news conditions |

### Install the App

**Desktop (Chrome/Edge):**

1. Visit [cryptocurrency.cv](https://cryptocurrency.cv)
2. Click the install icon (⊕) in the address bar
3. Click "Install"

**iOS Safari:**

1. Visit the site in Safari
2. Tap Share (📤) → "Add to Home Screen"

**Android Chrome:**

1. Visit the site
2. Tap the install banner or Menu → "Install app"

### Service Worker Caching

The PWA uses smart caching strategies:

| Content       | Strategy                         | Cache Duration |
| ------------- | -------------------------------- | -------------- |
| API responses | Network-first                    | 5 minutes      |
| Static assets | Cache-first                      | 7 days         |
| Images        | Cache-first                      | 30 days        |
| Navigation    | Network-first + offline fallback | 24 hours       |

### Keyboard Shortcuts

Power through news with keyboard navigation:

| Shortcut  | Action                  |
| --------- | ----------------------- |
| `j` / `k` | Next / previous article |
| `/`       | Focus search            |
| `Enter`   | Open selected article   |
| `d`       | Toggle dark mode        |
| `g h`     | Go to Home              |
| `g t`     | Go to Trending          |
| `g s`     | Go to Sources           |
| `g b`     | Go to Bookmarks         |
| `?`       | Show all shortcuts      |
| `Escape`  | Close modal             |

📖 **Full user guide:** [docs/USER-GUIDE.md](../USER-GUIDE.md)

