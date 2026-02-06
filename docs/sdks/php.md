# PHP SDK

The PHP SDK provides a simple interface for integrating crypto news into PHP applications.

## Installation

### Via Composer (Recommended)

```bash
composer require fcn/sdk
```

### Manual Installation

Download the SDK and include it in your project:

```php
require_once 'path/to/fcn-sdk/src/CryptoNews.php';
```

## Quick Start

```php
<?php
require_once 'vendor/autoload.php';

use FCN\CryptoNews;

// Create client (no API key needed!)
$client = new CryptoNews();

// Get latest news
$news = $client->getNews(['limit' => 10]);

foreach ($news['articles'] as $article) {
    echo "{$article['title']} - {$article['source']}\n";
}
```

## Configuration

```php
// Default client
$client = new CryptoNews();

// Custom configuration
$client = new CryptoNews([
    'base_url' => 'https://cryptocurrency.cv',
    'timeout' => 30,
    'verify_ssl' => true,
]);
```

## API Reference

### News Methods

```php
// Get latest news
$news = $client->getNews([
    'limit' => 10,
    'source' => 'coindesk',  // optional
    'category' => 'defi',    // optional
    'lang' => 'en',          // optional
]);

// Search news
$results = $client->search('bitcoin etf', ['limit' => 10]);

// Get breaking news (last 2 hours)
$breaking = $client->getBreakingNews(['limit' => 5]);

// Get DeFi news
$defi = $client->getDefiNews(['limit' => 10]);

// Get Bitcoin news
$bitcoin = $client->getBitcoinNews(['limit' => 10]);
```

### Market Methods

```php
// Get market overview
$market = $client->getMarket();
echo "BTC: $" . number_format($market['bitcoin']['price'], 2);

// Get specific coin
$eth = $client->getCoin('ethereum');

// Get Fear & Greed Index
$fg = $client->getFearGreedIndex();
echo "Fear & Greed: {$fg['value']} ({$fg['classification']})";

// Get trending coins
$trending = $client->getTrending();
```

### Category Filter

```php
// Get institutional research
$institutional = $client->getNews([
    'category' => 'institutional',
    'limit' => 20,
]);

// Get on-chain analytics
$onchain = $client->getNews([
    'category' => 'onchain',
    'limit' => 10,
]);

// Available categories
$categories = $client->getCategories();
foreach ($categories['categories'] as $cat) {
    echo "{$cat['id']}: {$cat['sourceCount']} sources\n";
}
```

## Translation

```php
// Get news in different languages
$spanish = $client->getNews(['lang' => 'es', 'limit' => 10]);
$japanese = $client->getNews(['lang' => 'ja', 'limit' => 10]);
$arabic = $client->getNews(['lang' => 'ar', 'limit' => 10]);
```

## Error Handling

```php
use FCN\CryptoNews;
use FCN\Exceptions\FCNException;
use FCN\Exceptions\NetworkException;
use FCN\Exceptions\ValidationException;

$client = new CryptoNews();

try {
    $news = $client->getNews(['limit' => 10]);
} catch (NetworkException $e) {
    echo "Network error: " . $e->getMessage();
} catch (ValidationException $e) {
    echo "Validation error: " . $e->getMessage();
} catch (FCNException $e) {
    echo "API error: " . $e->getMessage();
    echo "Status: " . $e->getStatusCode();
}
```

## Laravel Integration

### Service Provider

```php
// config/services.php
return [
    'fcn' => [
        'base_url' => env('FCN_BASE_URL', 'https://cryptocurrency.cv'),
        'timeout' => env('FCN_TIMEOUT', 30),
    ],
];

// app/Providers/FCNServiceProvider.php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use FCN\CryptoNews;

class FCNServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(CryptoNews::class, function ($app) {
            return new CryptoNews(config('services.fcn'));
        });
    }
}
```

### Controller Usage

```php
namespace App\Http\Controllers;

use FCN\CryptoNews;

class NewsController extends Controller
{
    public function __construct(
        private CryptoNews $crypto
    ) {}

    public function index()
    {
        $news = $this->crypto->getNews(['limit' => 10]);
        return view('news.index', compact('news'));
    }

    public function search(Request $request)
    {
        $results = $this->crypto->search(
            $request->input('q'),
            ['limit' => 20]
        );
        return response()->json($results);
    }
}
```

### Blade Template

```blade
@foreach ($news['articles'] as $article)
    <article>
        <h3>
            <a href="{{ $article['link'] }}" target="_blank">
                {{ $article['title'] }}
            </a>
        </h3>
        <p>{{ $article['description'] }}</p>
        <span class="text-gray-500">{{ $article['source'] }} · {{ $article['timeAgo'] }}</span>
    </article>
@endforeach
```

## WordPress Plugin

```php
<?php
/**
 * Plugin Name: Crypto News Widget
 * Description: Display crypto news from Free Crypto News API
 */

require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';

use FCN\CryptoNews;

function fcn_news_shortcode($atts) {
    $atts = shortcode_atts([
        'limit' => 5,
        'category' => null,
    ], $atts);

    $client = new CryptoNews();
    $news = $client->getNews([
        'limit' => (int) $atts['limit'],
        'category' => $atts['category'],
    ]);

    ob_start();
    ?>
    <div class="fcn-news">
        <?php foreach ($news['articles'] as $article): ?>
            <div class="fcn-article">
                <a href="<?php echo esc_url($article['link']); ?>" target="_blank">
                    <?php echo esc_html($article['title']); ?>
                </a>
                <span class="fcn-meta">
                    <?php echo esc_html($article['source']); ?> · 
                    <?php echo esc_html($article['timeAgo']); ?>
                </span>
            </div>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
}

add_shortcode('crypto_news', 'fcn_news_shortcode');
```

Usage: `[crypto_news limit="10" category="defi"]`

## Caching

```php
use FCN\CryptoNews;

$client = new CryptoNews();

// Simple file cache
$cacheFile = '/tmp/fcn_news_cache.json';
$cacheTime = 300; // 5 minutes

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    $news = json_decode(file_get_contents($cacheFile), true);
} else {
    $news = $client->getNews(['limit' => 10]);
    file_put_contents($cacheFile, json_encode($news));
}
```

## Source Code

View the full PHP SDK: [sdk/php](https://github.com/nirholas/free-crypto-news/tree/main/sdk/php)
