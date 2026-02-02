# Swift Examples

Comprehensive Swift examples for iOS, macOS, watchOS, and tvOS.

## Requirements

- Swift 5.9+
- iOS 15+ / macOS 12+ / watchOS 8+ / tvOS 15+

## Quick Start

### Command Line

```bash
cd examples/swift
swift run
```

### Xcode

1. Open `Package.swift` in Xcode
2. Run the target

## Usage

### Basic Client

```swift
import Foundation

let client = CryptoNewsClient()

// Get latest news
let news = try await client.getNews(limit: 10)
for article in news {
    print("📰 \(article.title)")
}

// Get Fear & Greed Index
let fg = try await client.getFearGreed()
print("😰 \(fg.classification): \(fg.value)")

// Get Bitcoin sentiment
let sentiment = try await client.getSentiment(asset: "BTC")
print("🎯 \(sentiment.label)")

// Search news
let results = try await client.searchNews(query: "ethereum ETF")

// Get trading signals
let signals = try await client.getSignals()

// Get whale alerts  
let whales = try await client.getWhaleAlerts()

// Ask AI
let answer = try await client.ask(question: "What is Bitcoin?")
```

### WebSocket Streaming

```swift
let stream = CryptoNewsStream()

stream.onConnect = {
    print("🔌 Connected!")
}

stream.onNews = { article in
    print("📰 \(article.title)")
}

stream.onPrice = { price in
    print("💹 \(price.symbol): $\(price.price)")
}

stream.onWhale = { whale in
    print("🐋 \(whale.symbol): $\(whale.usdValue)")
}

stream.connect()
stream.subscribe(to: "news")
stream.subscribe(to: "prices")
stream.subscribe(to: "whales")
```

### SwiftUI Integration

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = NewsViewModel()
    
    var body: some View {
        NavigationStack {
            List(viewModel.articles) { article in
                VStack(alignment: .leading) {
                    Text(article.title)
                        .font(.headline)
                    Text(article.source)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Crypto News")
            .refreshable {
                await viewModel.loadNews()
            }
        }
        .task {
            await viewModel.loadNews()
        }
    }
}
```

## Available Methods

### News
| Method | Description |
|--------|-------------|
| `getNews(limit:source:)` | Get latest news |
| `searchNews(query:limit:)` | Search news |
| `getBitcoinNews(limit:)` | Bitcoin-specific news |
| `getBreakingNews()` | Breaking news only |
| `getTrending(hours:)` | Trending topics |

### Market
| Method | Description |
|--------|-------------|
| `getFearGreed()` | Fear & Greed Index |
| `getPrices(symbols:)` | Current prices |

### AI
| Method | Description |
|--------|-------------|
| `getSentiment(asset:)` | Sentiment analysis |
| `getDigest()` | AI-generated digest |
| `ask(question:)` | Ask AI about crypto |

### Trading
| Method | Description |
|--------|-------------|
| `getSignals(limit:)` | Trading signals |
| `getWhaleAlerts(limit:)` | Large transactions |

## iOS App Example

See the included `NewsListView` SwiftUI view for a complete iOS app example.

## License

MIT
