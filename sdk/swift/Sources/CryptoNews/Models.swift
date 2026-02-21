import Foundation

// MARK: - Models

/// A single crypto news article.
///
/// `priceImpact` and `tone` fields inspired by
/// executium/trending-historical-cryptocurrency-news (MIT License).
public struct NewsArticle: Codable, CustomStringConvertible {
    public let title: String
    public let link: String
    public let description: String?
    public let pubDate: String
    public let source: String
    public let sourceKey: String
    public let category: String
    public let timeAgo: String
    /// Article author (when available).
    public let author: String?
    /// Source domain, e.g. "cointelegraph.com".
    public let domain: String?
    /// Thumbnail image URL.
    public let image: String?
    /// Price impact within 1 hour of publication.
    public let priceImpact: PriceImpact?
    /// 7-dimension tone analysis.
    public let tone: ArticleTone?

    enum CodingKeys: String, CodingKey {
        case title, link, description, pubDate, source, sourceKey
        case category, timeAgo, author, domain, image, tone
        case priceImpact = "price_impact"
    }

    public var debugDescription: String { "[\(source)] \(title)" }
    // Satisfies CustomStringConvertible
    public var description: String { debugDescription }
}

/// Price movement observed within 1 hour of article publication.
/// Inspired by executium/trending-historical-cryptocurrency-news (MIT).
public struct PriceImpact: Codable {
    /// Percentage change (positive = up, negative = down).
    public let percentage: Double?
    /// "positive", "negative", or "neutral".
    public let direction: String?
    /// Raw impact score.
    public let score: Double?
}

/// 7-dimension tone/emotion analysis.
/// Inspired by executium/trending-historical-cryptocurrency-news (MIT).
public struct ArticleTone: Codable {
    public let anger: Double
    public let fear: Double
    public let joy: Double
    public let sadness: Double
    public let analytical: Double
    public let confident: Double
    public let tentative: Double
}

// MARK: - Internal response envelopes

struct NewsResponse: Codable {
    let articles: [NewsArticle]
    let totalCount: Int
    let sources: [String]
    let fetchedAt: String?
}

struct SourcesResponse: Codable {
    let sources: [SourceInfo]
}

/// Metadata for a news source.
public struct SourceInfo: Codable {
    public let key: String
    public let name: String
    public let url: String
    public let category: String
    public let status: String
}
