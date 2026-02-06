# Swift Examples

Build iOS, macOS, watchOS, and tvOS apps with Free Crypto News.

## Overview

Full-featured Swift client with async/await support for all Apple platforms.

| Feature | Support |
|---------|---------|
| **Platforms** | iOS 15+, macOS 12+, watchOS 8+, tvOS 15+ |
| **Concurrency** | Swift Concurrency (async/await) |
| **Architecture** | Actor-based thread safety |
| **Dependencies** | Foundation only |

## Installation

### Swift Package Manager

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/nirholas/free-crypto-news-swift", from: "1.0.0")
]
```

### Manual Installation

Copy `CryptoNews.swift` to your project.

---

## Models

```swift
struct NewsArticle: Codable, Identifiable {
    let id: String?
    let title: String
    let link: String
    let source: String
    let description: String?
    let timeAgo: String?
    let pubDate: Date?
    let tickers: [String]?
}

struct FearGreedData: Codable {
    let value: Int           // 0-100
    let classification: String  // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
    let timestamp: Date?
}

struct SentimentData: Codable {
    let asset: String
    let label: String        // "bullish", "bearish", "neutral"
    let score: Double        // -1.0 to 1.0
    let confidence: Double   // 0.0 to 1.0
    let articlesAnalyzed: Int?
}

struct TradingSignal: Codable, Identifiable {
    let symbol: String
    let action: String       // "buy", "sell", "hold"
    let price: Double
    let confidence: Double
    let reason: String?
    let targets: SignalTargets?
}

struct WhaleAlert: Codable, Identifiable {
    let symbol: String
    let amount: Double
    let usdValue: Double
    let fromLabel: String
    let toLabel: String
    let type: String         // "transfer", "exchange_deposit", "exchange_withdrawal"
    let blockchain: String
    let timeAgo: String?
}
```

---

## API Client

```swift
actor CryptoNewsClient {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(baseURL: String = "https://cryptocurrency.cv") {
        self.baseURL = URL(string: baseURL)!
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }
    
    // MARK: - News
    
    func fetchNews(limit: Int = 20, ticker: String? = nil) async throws -> [NewsArticle] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/news"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        if let ticker = ticker {
            components.queryItems?.append(URLQueryItem(name: "ticker", value: ticker))
        }
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    func search(query: String, limit: Int = 20) async throws -> [NewsArticle] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/search"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    // MARK: - Market Data
    
    func fetchFearGreed() async throws -> FearGreedData {
        let url = baseURL.appendingPathComponent("/api/fear-greed")
        let (data, _) = try await session.data(from: url)
        return try decoder.decode(FearGreedData.self, from: data)
    }
    
    func fetchSentiment(asset: String) async throws -> SentimentData {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/ai/sentiment"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "asset", value: asset)]
        
        let (data, _) = try await session.data(from: components.url!)
        return try decoder.decode(SentimentData.self, from: data)
    }
    
    // MARK: - Trading
    
    func fetchSignals(asset: String? = nil) async throws -> [TradingSignal] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/signals"), resolvingAgainstBaseURL: false)!
        if let asset = asset {
            components.queryItems = [URLQueryItem(name: "asset", value: asset)]
        }
        
        let (data, _) = try await session.data(from: components.url!)
        return try decoder.decode([TradingSignal].self, from: data)
    }
    
    func fetchWhales(minAmount: Double? = nil) async throws -> [WhaleAlert] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/whales"), resolvingAgainstBaseURL: false)!
        if let minAmount = minAmount {
            components.queryItems = [URLQueryItem(name: "min", value: "\(minAmount)")]
        }
        
        let (data, _) = try await session.data(from: components.url!)
        return try decoder.decode([WhaleAlert].self, from: data)
    }
}
```

---

## SwiftUI Examples

### News Feed View

```swift
import SwiftUI

struct NewsFeedView: View {
    @State private var articles: [NewsArticle] = []
    @State private var isLoading = true
    @State private var searchText = ""
    
    private let client = CryptoNewsClient()
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading news...")
                } else {
                    List(articles) { article in
                        NewsRowView(article: article)
                    }
                    .refreshable {
                        await loadNews()
                    }
                }
            }
            .navigationTitle("Crypto News")
            .searchable(text: $searchText)
            .onSubmit(of: .search) {
                Task { await search() }
            }
            .task {
                await loadNews()
            }
        }
    }
    
    private func loadNews() async {
        do {
            articles = try await client.fetchNews(limit: 30)
            isLoading = false
        } catch {
            print("Error: \(error)")
        }
    }
    
    private func search() async {
        guard !searchText.isEmpty else { return }
        do {
            articles = try await client.search(query: searchText)
        } catch {
            print("Search error: \(error)")
        }
    }
}

struct NewsRowView: View {
    let article: NewsArticle
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(article.title)
                .font(.headline)
                .lineLimit(2)
            
            HStack {
                Text(article.source)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if let timeAgo = article.timeAgo {
                    Text(timeAgo)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
```

### Fear & Greed Gauge

```swift
struct FearGreedGauge: View {
    @State private var data: FearGreedData?
    
    private let client = CryptoNewsClient()
    
    var body: some View {
        VStack(spacing: 16) {
            if let data = data {
                Gauge(value: Double(data.value), in: 0...100) {
                    Text("Fear & Greed")
                } currentValueLabel: {
                    Text("\(data.value)")
                        .font(.largeTitle.bold())
                } minimumValueLabel: {
                    Text("0")
                } maximumValueLabel: {
                    Text("100")
                }
                .gaugeStyle(.accessoryCircular)
                .tint(gaugeColor(for: data.value))
                .scaleEffect(2)
                
                Text(data.classification)
                    .font(.title2)
                    .foregroundColor(gaugeColor(for: data.value))
            } else {
                ProgressView()
            }
        }
        .padding()
        .task {
            do {
                data = try await client.fetchFearGreed()
            } catch {
                print("Error: \(error)")
            }
        }
    }
    
    private func gaugeColor(for value: Int) -> Color {
        switch value {
        case 0..<25: return .red
        case 25..<45: return .orange
        case 45..<55: return .gray
        case 55..<75: return .green
        default: return .mint
        }
    }
}
```

### Sentiment Badge

```swift
struct SentimentBadge: View {
    let asset: String
    @State private var sentiment: SentimentData?
    
    private let client = CryptoNewsClient()
    
    var body: some View {
        Group {
            if let sentiment = sentiment {
                HStack(spacing: 4) {
                    Circle()
                        .fill(sentimentColor)
                        .frame(width: 8, height: 8)
                    
                    Text(sentiment.label.uppercased())
                        .font(.caption.bold())
                        .foregroundColor(sentimentColor)
                    
                    Text(String(format: "%.0f%%", sentiment.confidence * 100))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(sentimentColor.opacity(0.1))
                .cornerRadius(8)
            } else {
                ProgressView()
            }
        }
        .task {
            do {
                sentiment = try await client.fetchSentiment(asset: asset)
            } catch {
                print("Error: \(error)")
            }
        }
    }
    
    private var sentimentColor: Color {
        switch sentiment?.label {
        case "bullish": return .green
        case "bearish": return .red
        default: return .gray
        }
    }
}
```

### Whale Alerts Widget

```swift
struct WhaleAlertsView: View {
    @State private var alerts: [WhaleAlert] = []
    
    private let client = CryptoNewsClient()
    
    var body: some View {
        List(alerts) { alert in
            HStack {
                VStack(alignment: .leading) {
                    Text("\(alert.symbol)")
                        .font(.headline)
                    Text("\(alert.fromLabel) → \(alert.toLabel)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("$\(formatLarge(alert.usdValue))")
                        .font(.headline)
                        .foregroundColor(.orange)
                    Text(alert.timeAgo ?? "")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .task {
            do {
                alerts = try await client.fetchWhales(minAmount: 1_000_000)
            } catch {
                print("Error: \(error)")
            }
        }
    }
    
    private func formatLarge(_ value: Double) -> String {
        if value >= 1_000_000_000 {
            return String(format: "%.1fB", value / 1_000_000_000)
        } else if value >= 1_000_000 {
            return String(format: "%.1fM", value / 1_000_000)
        } else {
            return String(format: "%.0f", value)
        }
    }
}
```

---

## watchOS App

```swift
import SwiftUI
import WatchKit

@main
struct CryptoNewsWatchApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                FearGreedGauge()
                    .tabItem { Label("Index", systemImage: "gauge") }
                
                CompactNewsFeed()
                    .tabItem { Label("News", systemImage: "newspaper") }
            }
        }
    }
}

struct CompactNewsFeed: View {
    @State private var articles: [NewsArticle] = []
    private let client = CryptoNewsClient()
    
    var body: some View {
        List(articles.prefix(5)) { article in
            Text(article.title)
                .font(.caption)
                .lineLimit(3)
        }
        .task {
            articles = (try? await client.fetchNews(limit: 5)) ?? []
        }
    }
}
```

---

## Widgets (WidgetKit)

```swift
import WidgetKit
import SwiftUI

struct FearGreedEntry: TimelineEntry {
    let date: Date
    let value: Int
    let classification: String
}

struct FearGreedProvider: TimelineProvider {
    func placeholder(in context: Context) -> FearGreedEntry {
        FearGreedEntry(date: Date(), value: 50, classification: "Neutral")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (FearGreedEntry) -> Void) {
        completion(placeholder(in: context))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<FearGreedEntry>) -> Void) {
        Task {
            let client = CryptoNewsClient()
            if let data = try? await client.fetchFearGreed() {
                let entry = FearGreedEntry(
                    date: Date(),
                    value: data.value,
                    classification: data.classification
                )
                let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
                let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
                completion(timeline)
            }
        }
    }
}

struct FearGreedWidget: Widget {
    let kind = "FearGreedWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FearGreedProvider()) { entry in
            FearGreedWidgetView(entry: entry)
        }
        .configurationDisplayName("Fear & Greed")
        .description("Crypto market sentiment index")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct FearGreedWidgetView: View {
    let entry: FearGreedEntry
    
    var body: some View {
        VStack {
            Text("\(entry.value)")
                .font(.system(size: 48, weight: .bold))
            Text(entry.classification)
                .font(.caption)
        }
    }
}
```

---

## Related

- [Mobile App](../integrations/mobile.md)
- [React Examples](react.md)
- [API Reference](../API.md)
