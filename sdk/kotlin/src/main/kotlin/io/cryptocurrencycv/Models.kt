package io.cryptocurrencycv

import com.google.gson.annotations.SerializedName

/**
 * A single crypto news article.
 *
 * [priceImpact] and [tone] inspired by
 * executium/trending-historical-cryptocurrency-news (MIT License).
 */
data class NewsArticle(
    val title: String = "",
    val link: String = "",
    val description: String? = null,
    val pubDate: String = "",
    val source: String = "",
    val sourceKey: String = "",
    val category: String = "",
    val timeAgo: String = "",
    /** Article author (when available). */
    val author: String? = null,
    /** Source domain, e.g. "cointelegraph.com". */
    val domain: String? = null,
    /** Thumbnail image URL. */
    val image: String? = null,
    /** Price impact within 1 hour of publication. */
    @SerializedName("price_impact")
    val priceImpact: PriceImpact? = null,
    /** 7-dimension tone analysis. */
    val tone: Tone? = null,
) {
    override fun toString() = "[$source] $title ($pubDate)"
}

/**
 * Price movement observed within 1 hour of article publication.
 * Inspired by executium/trending-historical-cryptocurrency-news (MIT).
 */
data class PriceImpact(
    /** Percentage change (positive = up, negative = down). */
    val percentage: Double? = null,
    /** "positive", "negative", or "neutral". */
    val direction: String? = null,
    /** Raw impact score. */
    val score: Double? = null,
)

/**
 * 7-dimension tone/emotion analysis.
 * Inspired by executium/trending-historical-cryptocurrency-news (MIT).
 */
data class Tone(
    val anger: Double = 0.0,
    val fear: Double = 0.0,
    val joy: Double = 0.0,
    val sadness: Double = 0.0,
    val analytical: Double = 0.0,
    val confident: Double = 0.0,
    val tentative: Double = 0.0,
)

internal data class NewsResponse(
    val articles: List<NewsArticle> = emptyList(),
    val totalCount: Int = 0,
    val sources: List<String> = emptyList(),
)

/** Metadata for a news source. */
data class SourceInfo(
    val key: String = "",
    val name: String = "",
    val url: String = "",
    val category: String = "",
    val status: String = "",
)

internal data class SourcesResponse(val sources: List<SourceInfo> = emptyList())
