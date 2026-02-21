import Foundation

/// Swift SDK for the Free Crypto News API (https://cryptocurrency.cv).
/// No API key required. Uses Swift Concurrency (async/await).
///
/// Structural inspiration from
/// executium/trending-historical-cryptocurrency-news (MIT License).
///
/// ```swift
/// let client = CryptoNewsClient()
/// let articles = try await client.getLatest(limit: 10)
/// articles.forEach { print($0) }
/// ```
public actor CryptoNewsClient {

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(
        baseURL: URL = URL(string: "https://cryptocurrency.cv")!,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
    }

    // MARK: - Private helpers

    private func fetch<T: Decodable>(_ path: String) async throws -> T {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("free-crypto-news-swift-sdk/1.0", forHTTPHeaderField: "User-Agent")

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func articles(path: String) async throws -> [NewsArticle] {
        let resp: NewsResponse = try await fetch(path)
        return resp.articles
    }

    // MARK: - Public API

    /// Get the latest crypto news from all sources.
    /// - Parameter limit: 1–50 articles (default 10)
    /// - Parameter source: Optional source key filter
    public func getLatest(limit: Int = 10, source: String? = nil) async throws -> [NewsArticle] {
        var path = "/api/news?limit=\(limit)"
        if let source = source {
            path += "&source=\(source.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? source)"
        }
        return try await articles(path: path)
    }

    /// Full-text news search.
    /// - Parameter keywords: Search terms
    /// - Parameter limit: 1–30 articles
    public func search(_ keywords: String, limit: Int = 10) async throws -> [NewsArticle] {
        let encoded = keywords.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? keywords
        return try await articles(path: "/api/search?q=\(encoded)&limit=\(limit)")
    }

    /// Get DeFi-specific news.
    public func getDefi(limit: Int = 10) async throws -> [NewsArticle] {
        try await articles(path: "/api/defi?limit=\(limit)")
    }

    /// Get Bitcoin-specific news.
    public func getBitcoin(limit: Int = 10) async throws -> [NewsArticle] {
        try await articles(path: "/api/bitcoin?limit=\(limit)")
    }

    /// Get breaking news from the last 2 hours.
    public func getBreaking(limit: Int = 5) async throws -> [NewsArticle] {
        try await articles(path: "/api/breaking?limit=\(limit)")
    }

    /// Get the list of all news sources.
    public func getSources() async throws -> [SourceInfo] {
        let resp: SourcesResponse = try await fetch("/api/sources")
        return resp.sources
    }
}
