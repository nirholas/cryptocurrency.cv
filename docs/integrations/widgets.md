# Embeddable Widgets

Embed crypto news on any website with our JavaScript widgets.

## Available Widgets

1. **News Feed** - Scrolling list of articles
2. **News Ticker** - Horizontal scrolling headlines
3. **News Carousel** - Rotating news cards
4. **Price Ticker** - Live price updates

## Quick Start

Add this single line to any HTML page:

```html
<script src="https://cryptocurrency.cv/widget/crypto-news.js"></script>
```

A news feed will automatically appear.

## News Feed Widget

### Basic Usage

```html
<div id="crypto-news-feed"></div>
<script src="https://cryptocurrency.cv/widget/feed.js"></script>
```

### With Options

```html
<div id="crypto-news-feed"></div>
<script>
  window.CryptoNewsFeed = {
    container: '#crypto-news-feed',
    limit: 10,
    category: 'defi',
    showSource: true,
    showTime: true,
    showDescription: true,
    theme: 'dark',
    refreshInterval: 300000, // 5 minutes
  };
</script>
<script src="https://cryptocurrency.cv/widget/feed.js"></script>
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string | `#crypto-news-feed` | CSS selector for container |
| `limit` | number | `10` | Number of articles |
| `category` | string | `null` | Filter by category |
| `source` | string | `null` | Filter by source |
| `showSource` | boolean | `true` | Show source name |
| `showTime` | boolean | `true` | Show time ago |
| `showDescription` | boolean | `true` | Show article description |
| `theme` | string | `auto` | `light`, `dark`, or `auto` |
| `refreshInterval` | number | `300000` | Auto-refresh (ms) |
| `lang` | string | `en` | Language code |

## News Ticker Widget

Horizontal scrolling headlines for headers/footers.

### Basic Usage

```html
<div id="crypto-ticker"></div>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
```

### With Options

```html
<div id="crypto-ticker"></div>
<script>
  window.CryptoNewsTicker = {
    container: '#crypto-ticker',
    limit: 20,
    speed: 'normal', // 'slow', 'normal', 'fast'
    pauseOnHover: true,
    showSource: false,
    theme: 'dark',
  };
</script>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
```

### Ticker Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `speed` | string | `normal` | Scroll speed |
| `pauseOnHover` | boolean | `true` | Pause on mouse hover |
| `direction` | string | `left` | `left` or `right` |
| `gap` | number | `50` | Gap between items (px) |

## News Carousel Widget

Rotating news cards with transitions.

### Basic Usage

```html
<div id="crypto-carousel"></div>
<script src="https://cryptocurrency.cv/widget/carousel.js"></script>
```

### With Options

```html
<div id="crypto-carousel"></div>
<script>
  window.CryptoNewsCarousel = {
    container: '#crypto-carousel',
    limit: 5,
    autoPlay: true,
    interval: 5000,
    showDots: true,
    showArrows: true,
    transition: 'slide', // 'slide', 'fade'
  };
</script>
<script src="https://cryptocurrency.cv/widget/carousel.js"></script>
```

## Price Ticker Widget

Live cryptocurrency prices.

### Basic Usage

```html
<div id="crypto-prices"></div>
<script src="https://cryptocurrency.cv/widget/prices.js"></script>
```

### With Options

```html
<div id="crypto-prices"></div>
<script>
  window.CryptoPriceTicker = {
    container: '#crypto-prices',
    coins: ['bitcoin', 'ethereum', 'solana'],
    showChange: true,
    showIcon: true,
    refreshInterval: 30000,
    compact: false,
  };
</script>
<script src="https://cryptocurrency.cv/widget/prices.js"></script>
```

## Styling

### CSS Variables

Override default styles with CSS variables:

```css
:root {
  --fcn-bg: #1a1a2e;
  --fcn-text: #ffffff;
  --fcn-link: #4a9eff;
  --fcn-border: #333;
  --fcn-source: #888;
  --fcn-time: #666;
  --fcn-positive: #00c853;
  --fcn-negative: #ff1744;
  --fcn-font: 'Inter', sans-serif;
  --fcn-radius: 8px;
}
```

### Custom CSS

```html
<style>
  .fcn-article {
    padding: 16px;
    border-bottom: 1px solid var(--fcn-border);
  }
  
  .fcn-article-title {
    font-size: 16px;
    font-weight: 600;
  }
  
  .fcn-article-description {
    font-size: 14px;
    color: var(--fcn-text);
    opacity: 0.8;
  }
</style>
```

### Themes

```javascript
// Light theme
window.CryptoNewsFeed = { theme: 'light' };

// Dark theme
window.CryptoNewsFeed = { theme: 'dark' };

// Auto (matches system preference)
window.CryptoNewsFeed = { theme: 'auto' };
```

## Framework Integration

### React

```jsx
import { useEffect, useRef } from 'react';

function CryptoNewsWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    window.CryptoNewsFeed = {
      container: containerRef.current,
      limit: 10,
    };
    
    const script = document.createElement('script');
    script.src = 'https://cryptocurrency.cv/widget/feed.js';
    document.body.appendChild(script);
    
    return () => script.remove();
  }, []);

  return <div ref={containerRef} />;
}
```

### Vue

```vue
<template>
  <div ref="newsContainer"></div>
</template>

<script>
export default {
  mounted() {
    window.CryptoNewsFeed = {
      container: this.$refs.newsContainer,
      limit: 10,
    };
    
    const script = document.createElement('script');
    script.src = 'https://cryptocurrency.cv/widget/feed.js';
    document.body.appendChild(script);
  }
};
</script>
```

### WordPress

Use shortcode in any post or page:

```
[crypto_news limit="10" category="defi" theme="dark"]
```

Or add to theme:

```php
function crypto_news_widget() {
  ?>
  <div id="crypto-news-feed"></div>
  <script>
    window.CryptoNewsFeed = { limit: 10, theme: 'dark' };
  </script>
  <script src="https://cryptocurrency.cv/widget/feed.js"></script>
  <?php
}
```

## Self-Hosting Widgets

Host widgets on your own server:

```bash
# Download widgets
curl -O https://cryptocurrency.cv/widget/feed.js
curl -O https://cryptocurrency.cv/widget/ticker.js
curl -O https://cryptocurrency.cv/widget/carousel.js

# Configure API endpoint
sed -i 's|https://cryptocurrency.cv|https://your-domain.com|g' *.js
```

## Source Code

View widget source code: [widget/](https://github.com/nirholas/free-crypto-news/tree/main/widget)
