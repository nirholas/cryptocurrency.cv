# C# / .NET Examples

Comprehensive C# examples for the Free Crypto News API.

## Requirements

- .NET 8.0+

## Quick Start

```bash
cd examples/csharp
dotnet run
```

## Usage

```csharp
using FreeCryptoNews;

// Initialize client
using var client = new CryptoNewsClient();

// Get latest news
var news = await client.GetNewsAsync(10);
foreach (var article in news.Data)
{
    Console.WriteLine($"📰 {article.Title}");
}

// Get Fear & Greed Index
var fg = await client.GetFearGreedAsync();
Console.WriteLine($"😰 {fg.Classification}: {fg.Value}");

// Get Bitcoin sentiment
var sentiment = await client.GetSentimentAsync("BTC");
Console.WriteLine($"🎯 {sentiment.Label} ({sentiment.Score:F2})");

// Search news
var results = await client.SearchNewsAsync("ethereum ETF");

// Get trading signals
var signals = await client.GetSignalsAsync();

// Get whale alerts
var whales = await client.GetWhaleAlertsAsync();
```

## WebSocket Streaming

```csharp
using var stream = new CryptoNewsStream();

stream.OnNews += article => Console.WriteLine($"📰 {article.Title}");
stream.OnPrice += price => Console.WriteLine($"💹 {price.Symbol}: ${price.Price}");
stream.OnWhale += whale => Console.WriteLine($"🐋 {whale.Symbol}: ${whale.UsdValue:N0}");

await stream.ConnectAsync();
await stream.SubscribeAsync("news");
await stream.SubscribeAsync("prices");
await stream.SubscribeAsync("whales");

// Keep running
await Task.Delay(TimeSpan.FromMinutes(5));
await stream.DisconnectAsync();
```

## Available Methods

### News
| Method | Description |
|--------|-------------|
| `GetNewsAsync(limit, source)` | Get latest news |
| `SearchNewsAsync(query, limit)` | Search news |
| `GetBitcoinNewsAsync(limit)` | Bitcoin-specific news |
| `GetBreakingNewsAsync()` | Breaking news only |
| `GetTrendingAsync(hours)` | Trending topics |

### Market
| Method | Description |
|--------|-------------|
| `GetFearGreedAsync()` | Fear & Greed Index |
| `GetPricesAsync(symbols)` | Current prices |
| `GetCoinAsync(symbol)` | Single coin details |

### AI
| Method | Description |
|--------|-------------|
| `GetSentimentAsync(asset)` | Sentiment analysis |
| `GetDailyDigestAsync()` | AI-generated digest |
| `AskQuestionAsync(question)` | Ask AI about crypto |

### Trading
| Method | Description |
|--------|-------------|
| `GetSignalsAsync(limit)` | Trading signals |
| `GetWhaleAlertsAsync(limit)` | Large transactions |

## NuGet Package

Coming soon: `Install-Package FreeCryptoNews`

## License

MIT
