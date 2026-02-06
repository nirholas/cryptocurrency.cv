# Embeddable Widgets

Drop-in crypto news widgets for any website!

## Ticker Widget

A scrolling news ticker that displays latest crypto headlines.

### Quick Start

```html
<div id="crypto-ticker"></div>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
```

### Configuration Options

```html
<div id="crypto-ticker"
     data-speed="30"
     data-limit="20"
     data-category="all"
     data-theme="dark">
</div>
```

| Option | Default | Description |
|--------|---------|-------------|
| `data-speed` | `30` | Scroll speed (lower = faster) |
| `data-limit` | `15` | Number of headlines |
| `data-category` | `all` | Filter: `all`, `bitcoin`, `defi` |
| `data-theme` | `dark` | Theme: `dark`, `light` |

### Preview

[View Ticker Demo](https://cryptocurrency.cv/widget/ticker.html)

---

## Carousel Widget

A rotating featured news carousel with auto-play.

### Quick Start

```html
<div id="crypto-carousel"></div>
<script src="https://cryptocurrency.cv/widget/carousel.js"></script>
```

### Configuration Options

```html
<div id="crypto-carousel"
     data-limit="6"
     data-interval="5000"
     data-theme="dark"
     data-variant="default"
     data-autoplay="true">
</div>
```

| Option | Default | Description |
|--------|---------|-------------|
| `data-limit` | `5` | Number of slides |
| `data-interval` | `5000` | Auto-advance interval (ms) |
| `data-theme` | `dark` | Theme: `dark`, `light` |
| `data-variant` | `default` | Style: `default`, `grid` |
| `data-autoplay` | `true` | Auto-advance slides |

### Preview

[View Carousel Demo](https://cryptocurrency.cv/widget/carousel.html)

---

## Styling

Both widgets inject their own CSS styles automatically. To customize:

```css
/* Override ticker styles */
.crypto-ticker-container {
    background: #your-color !important;
}

/* Override carousel styles */
.crypto-carousel-container {
    max-width: 800px !important;
}
```

## Self-Hosted

To use widgets with a self-hosted API:

```html
<script>
  window.CRYPTO_NEWS_API = 'https://your-instance.vercel.app';
</script>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
```

## No API Key Required!

100% free - just embed and go!
