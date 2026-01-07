# Free Crypto News PHP SDK

100% FREE PHP SDK for the Free Crypto News API. No API keys required!

## Installation

Just copy the file:

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/php/CryptoNews.php
```

Or via Composer (coming soon):

```bash
composer require nirholas/crypto-news
```

## Usage

```php
<?php
require_once 'CryptoNews.php';

$news = new CryptoNews();

// Get latest news
$articles = $news->getLatest(10);
foreach ($articles as $article) {
    echo "📰 {$article['title']}\n";
    echo "   {$article['source']} • {$article['timeAgo']}\n";
    echo "   {$article['link']}\n\n";
}

// Search for specific topics
$results = $news->search('ethereum,etf', 5);

// Get DeFi news
$defi = $news->getDefi(5);

// Get Bitcoin news
$btc = $news->getBitcoin(5);

// Get breaking news (last 2 hours)
$breaking = $news->getBreaking(5);

// Get trending topics
$trending = $news->getTrending(10, 24);
foreach ($trending['trending'] as $topic) {
    echo "{$topic['topic']}: {$topic['count']} mentions ({$topic['sentiment']})\n";
}

// Get all sources
$sources = $news->getSources();

// Check API health
$health = $news->getHealth();
echo "API Status: {$health['status']}\n";

// Get statistics
$stats = $news->getStats();
```

## Quick Functions

```php
<?php
require_once 'CryptoNews.php';

// One-liners
$news = getCryptoNews(5);
$results = searchCryptoNews('bitcoin', 10);
```

## Custom Base URL

For self-hosted instances:

```php
$news = new CryptoNews('https://your-instance.com');
```

## API Methods

| Method | Description |
|--------|-------------|
| `getLatest($limit, $source)` | Get latest news |
| `getLatestWithMeta($limit)` | Get news with full metadata |
| `search($keywords, $limit)` | Search by keywords |
| `getDefi($limit)` | DeFi-specific news |
| `getBitcoin($limit)` | Bitcoin-specific news |
| `getBreaking($limit)` | Breaking news (last 2h) |
| `getTrending($limit, $hours)` | Trending topics |
| `getStats()` | Analytics data |
| `analyze($limit, $topic, $sentiment)` | Sentiment analysis |
| `getArchive($date, $query, $limit)` | Historical archive |
| `getOrigins($query, $category, $limit)` | Find original sources |
| `getSources()` | List all sources |
| `getHealth()` | API health status |
| `getRssUrl($feed)` | Get RSS feed URL |
| `getAtomUrl($feed)` | Get Atom feed URL |

## Analytics & Sources

```php
// Analyze news with sentiment
$analysis = $news->analyze(20, 'bitcoin', 'bullish');
echo "Market: {$analysis['summary']['overall_sentiment']}\n";

// Get archived news
$archive = $news->getArchive('2024-01-15', 'SEC', 20);

// Find original sources
$origins = $news->getOrigins('binance', 'exchange', 10);
foreach ($origins['items'] as $item) {
    echo "{$item['title']} - Original: {$item['likely_original_source']}\n";
}
```

## Requirements

- PHP 7.4+
- `allow_url_fopen` enabled (or use cURL version)

## License

MIT
