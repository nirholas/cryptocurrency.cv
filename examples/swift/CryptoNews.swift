/**
 * Free Crypto News - Swift Examples
 * 
 * Comprehensive examples for iOS, macOS, watchOS, and tvOS.
 * 
 * Requirements:
 *   - Swift 5.9+
 *   - iOS 15+ / macOS 12+ / watchOS 8+ / tvOS 15+
 */

import Foundation

// MARK: - Models

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

struct NewsResponse: Codable {
    let data: [NewsArticle]
    let total: Int
    let success: Bool
}

struct FearGreedData: Codable {
    let value: Int
    let classification: String
    let timestamp: Date?
}

struct SentimentData: Codable {
    let asset: String
    let label: String
    let score: Double
    let confidence: Double
    let articlesAnalyzed: Int?
}

struct TrendingTopic: Codable, Identifiable {
    var id: String { topic }
    let topic: String
    let count: Int
    let sentiment: String?
    let change: Double?
}

struct WhaleAlert: Codable, Identifiable {
    var id: String { "\(symbol)-\(usdValue)-\(timeAgo ?? "")" }
    let symbol: String
    let amount: Double
    let usdValue: Double
    let fromLabel: String
    let toLabel: String
    let type: String
    let blockchain: String
    let timeAgo: String?
}

struct TradingSignal: Codable, Identifiable {
    var id: String { "\(symbol)-\(action)-\(price)" }
    let symbol: String
    let action: String
    let price: Double
    let confidence: Double
    let reason: String?
    let targets: SignalTargets?
}

struct SignalTargets: Codable {
    let takeProfit: Double
    let stopLoss: Double
}

struct CoinPrice: Codable, Identifiable {
    var id: String { symbol }
    let symbol: String
    let name: String
    let price: Double
    let change24h: Double
    let marketCap: Double
    let volume24h: Double
}

// MARK: - API Client

actor CryptoNewsClient {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(apiKey: String? = nil, baseURL: String = "https://cryptocurrency.cv") {
        self.baseURL = URL(string: baseURL)!
        
        let config = URLSessionConfiguration.default
        config.httpAdditionalHeaders = [
            "User-Agent": "FCN-Swift/1.0"
        ]
        if let apiKey = apiKey {
            config.httpAdditionalHeaders?["Authorization"] = "Bearer \(apiKey)"
        }
        
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
    }
    
    // MARK: - News Endpoints
    
    func getNews(limit: Int = 20, source: String? = nil) async throws -> [NewsArticle] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/news"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        if let source = source {
            components.queryItems?.append(URLQueryItem(name: "source", value: source))
        }
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    func searchNews(query: String, limit: Int = 20) async throws -> [NewsArticle] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/search"), resolvingAgainstBaseURL: true)!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    func getBitcoinNews(limit: Int = 20) async throws -> [NewsArticle] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/bitcoin"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    func getBreakingNews() async throws -> [NewsArticle] {
        let url = baseURL.appendingPathComponent("/api/breaking")
        let (data, _) = try await session.data(from: url)
        let response = try decoder.decode(NewsResponse.self, from: data)
        return response.data
    }
    
    func getTrending(hours: Int = 24) async throws -> [TrendingTopic] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/trending"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "hours", value: "\(hours)")]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode([String: [TrendingTopic]].self, from: data)
        return response["data"] ?? []
    }
    
    // MARK: - Market Endpoints
    
    func getFearGreed() async throws -> FearGreedData {
        let url = baseURL.appendingPathComponent("/api/market/fear-greed")
        let (data, _) = try await session.data(from: url)
        let response = try decoder.decode([String: FearGreedData].self, from: data)
        return response["data"]!
    }
    
    func getPrices(symbols: [String]) async throws -> [CoinPrice] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/prices"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "symbols", value: symbols.joined(separator: ","))]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode([String: [CoinPrice]].self, from: data)
        return response["data"] ?? []
    }
    
    // MARK: - AI Endpoints
    
    func getSentiment(asset: String) async throws -> SentimentData {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/ai/sentiment"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "asset", value: asset)]
        
        let (data, _) = try await session.data(from: components.url!)
        return try decoder.decode(SentimentData.self, from: data)
    }
    
    func getDigest() async throws -> String {
        let url = baseURL.appendingPathComponent("/api/ai/digest")
        let (data, _) = try await session.data(from: url)
        let response = try decoder.decode([String: String].self, from: data)
        return response["digest"] ?? ""
    }
    
    func ask(question: String) async throws -> String {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/ai/ask"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "q", value: question)]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode([String: String].self, from: data)
        return response["answer"] ?? ""
    }
    
    // MARK: - Trading Endpoints
    
    func getSignals(limit: Int = 10) async throws -> [TradingSignal] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/trading/signals"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode([String: [TradingSignal]].self, from: data)
        return response["data"] ?? []
    }
    
    func getWhaleAlerts(limit: Int = 20) async throws -> [WhaleAlert] {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/whales"), resolvingAgainstBaseURL: true)!
        components.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        
        let (data, _) = try await session.data(from: components.url!)
        let response = try decoder.decode([String: [WhaleAlert]].self, from: data)
        return response["data"] ?? []
    }
}

// MARK: - WebSocket Streaming

class CryptoNewsStream: NSObject, URLSessionWebSocketDelegate {
    private var webSocket: URLSessionWebSocketTask?
    private let baseURL: String
    
    var onNews: ((NewsArticle) -> Void)?
    var onPrice: ((CoinPrice) -> Void)?
    var onWhale: ((WhaleAlert) -> Void)?
    var onError: ((Error) -> Void)?
    var onConnect: (() -> Void)?
    var onDisconnect: (() -> Void)?
    
    init(baseURL: String = "wss://cryptocurrency.cv") {
        self.baseURL = baseURL
        super.init()
    }
    
    func connect() {
        let url = URL(string: "\(baseURL)/api/ws")!
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()
        receiveMessage()
    }
    
    func subscribe(to channel: String) {
        let message = """
        {"action": "subscribe", "channel": "\(channel)"}
        """
        webSocket?.send(.string(message)) { [weak self] error in
            if let error = error {
                self?.onError?(error)
            }
        }
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                self?.receiveMessage()
                
            case .failure(let error):
                self?.onError?(error)
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        do {
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard let type = json?["type"] as? String,
                  let payloadData = json?["data"] else { return }
            
            let payload = try JSONSerialization.data(withJSONObject: payloadData)
            
            switch type {
            case "news":
                let article = try decoder.decode(NewsArticle.self, from: payload)
                DispatchQueue.main.async { self.onNews?(article) }
            case "price":
                let price = try decoder.decode(CoinPrice.self, from: payload)
                DispatchQueue.main.async { self.onPrice?(price) }
            case "whale":
                let whale = try decoder.decode(WhaleAlert.self, from: payload)
                DispatchQueue.main.async { self.onWhale?(whale) }
            default:
                break
            }
        } catch {
            onError?(error)
        }
    }
    
    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
    }
    
    // MARK: - URLSessionWebSocketDelegate
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        DispatchQueue.main.async { self.onConnect?() }
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        DispatchQueue.main.async { self.onDisconnect?() }
    }
}

// MARK: - SwiftUI Views (iOS/macOS)

#if canImport(SwiftUI)
import SwiftUI

@MainActor
class NewsViewModel: ObservableObject {
    @Published var articles: [NewsArticle] = []
    @Published var trending: [TrendingTopic] = []
    @Published var fearGreed: FearGreedData?
    @Published var isLoading = false
    @Published var error: String?
    
    private let client = CryptoNewsClient()
    
    func loadNews() async {
        isLoading = true
        error = nil
        
        do {
            async let newsTask = client.getNews(limit: 20)
            async let trendingTask = client.getTrending()
            async let fearGreedTask = client.getFearGreed()
            
            let (news, trending, fearGreed) = try await (newsTask, trendingTask, fearGreedTask)
            
            self.articles = news
            self.trending = trending
            self.fearGreed = fearGreed
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

struct NewsListView: View {
    @StateObject private var viewModel = NewsViewModel()
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else if let error = viewModel.error {
                    VStack {
                        Text("Error: \(error)")
                            .foregroundColor(.red)
                        Button("Retry") {
                            Task { await viewModel.loadNews() }
                        }
                    }
                } else {
                    List {
                        // Fear & Greed Section
                        if let fg = viewModel.fearGreed {
                            Section("Market Sentiment") {
                                HStack {
                                    Text("Fear & Greed")
                                    Spacer()
                                    Text("\(fg.value) - \(fg.classification)")
                                        .foregroundColor(fg.value > 50 ? .green : .red)
                                }
                            }
                        }
                        
                        // Trending Section
                        if !viewModel.trending.isEmpty {
                            Section("Trending") {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack {
                                        ForEach(viewModel.trending.prefix(5)) { topic in
                                            Text(topic.topic)
                                                .padding(.horizontal, 12)
                                                .padding(.vertical, 6)
                                                .background(Color.blue.opacity(0.2))
                                                .cornerRadius(16)
                                        }
                                    }
                                }
                            }
                        }
                        
                        // News Section
                        Section("Latest News") {
                            ForEach(viewModel.articles) { article in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(article.title)
                                        .font(.headline)
                                    HStack {
                                        Text(article.source)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        if let timeAgo = article.timeAgo {
                                            Text("•")
                                                .foregroundColor(.secondary)
                                            Text(timeAgo)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.loadNews()
                    }
                }
            }
            .navigationTitle("📰 Crypto News")
        }
        .task {
            await viewModel.loadNews()
        }
    }
}

#Preview {
    NewsListView()
}
#endif

// MARK: - Example Usage

@main
struct CryptoNewsApp {
    static func main() async {
        print("═══════════════════════════════════════════════════════")
        print("       Free Crypto News - Swift Examples")
        print("═══════════════════════════════════════════════════════\n")
        
        let client = CryptoNewsClient()
        
        // News
        print("📰 Latest News:")
        print("─────────────────────────────────────────────────────────")
        do {
            let news = try await client.getNews(limit: 5)
            for article in news {
                print("  • \(article.title)")
                print("    \(article.source) | \(article.timeAgo ?? "")")
            }
        } catch {
            print("  Error: \(error)")
        }
        
        // Fear & Greed
        print("\n😰 Fear & Greed Index:")
        print("─────────────────────────────────────────────────────────")
        do {
            let fg = try await client.getFearGreed()
            print("  Value: \(fg.value)")
            print("  Classification: \(fg.classification)")
        } catch {
            print("  Error: \(error)")
        }
        
        // Sentiment
        print("\n🎯 Bitcoin Sentiment:")
        print("─────────────────────────────────────────────────────────")
        do {
            let sentiment = try await client.getSentiment(asset: "BTC")
            print("  Label: \(sentiment.label)")
            print("  Score: \(String(format: "%.2f", sentiment.score))")
        } catch {
            print("  Error: \(error)")
        }
        
        // Trending
        print("\n🔥 Trending Topics:")
        print("─────────────────────────────────────────────────────────")
        do {
            let trending = try await client.getTrending()
            for topic in trending.prefix(5) {
                let emoji = topic.sentiment == "bullish" ? "🟢" :
                           topic.sentiment == "bearish" ? "🔴" : "⚪"
                print("  \(emoji) \(topic.topic) (\(topic.count) mentions)")
            }
        } catch {
            print("  Error: \(error)")
        }
        
        // Trading Signals
        print("\n📊 Trading Signals:")
        print("─────────────────────────────────────────────────────────")
        do {
            let signals = try await client.getSignals(limit: 3)
            for signal in signals {
                let emoji = signal.action == "buy" || signal.action == "long" ? "🟢" : "🔴"
                print("  \(emoji) \(signal.action.uppercased()) \(signal.symbol) @ $\(String(format: "%.2f", signal.price))")
            }
        } catch {
            print("  Error: \(error)")
        }
        
        // Whale Alerts
        print("\n🐋 Whale Alerts:")
        print("─────────────────────────────────────────────────────────")
        do {
            let whales = try await client.getWhaleAlerts(limit: 5)
            for whale in whales {
                let emoji = whale.type == "exchange_inflow" ? "📥" :
                           whale.type == "exchange_outflow" ? "📤" : "🔄"
                print("  \(emoji) \(whale.symbol): $\(Int(whale.usdValue).formatted())")
            }
        } catch {
            print("  Error: \(error)")
        }
        
        print("\n═══════════════════════════════════════════════════════")
        print("       Examples Complete!")
        print("═══════════════════════════════════════════════════════")
    }
}
