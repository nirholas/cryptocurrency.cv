package io.cryptocurrencycv

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.time.Duration

/**
 * Kotlin SDK for the Free Crypto News API (https://cryptocurrency.cv).
 * No API key required. All methods are synchronous.
 *
 * Structural inspiration from
 * executium/trending-historical-cryptocurrency-news (MIT License).
 *
 * ```kotlin
 * val client = CryptoNews()
 * val articles = client.getLatest(10)
 * articles.forEach { println(it) }
 * ```
 */
class CryptoNews(private val baseUrl: String = "https://cryptocurrency.cv") {

    private val http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build()

    private val gson = Gson()

    // ── Private helpers ─────────────────────────────────────────

    private fun get(path: String): String {
        val req = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl$path"))
            .timeout(Duration.ofSeconds(30))
            .header("Accept", "application/json")
            .header("User-Agent", "free-crypto-news-kotlin-sdk/1.0")
            .GET()
            .build()

        val resp = http.send(req, HttpResponse.BodyHandlers.ofString())
        check(resp.statusCode() in 200..299) { "HTTP ${resp.statusCode()} from $path" }
        return resp.body()
    }

    private fun articlesFrom(path: String): List<NewsArticle> =
        gson.fromJson(get(path), NewsResponse::class.java).articles

    private fun encode(s: String) = URLEncoder.encode(s, StandardCharsets.UTF_8)

    // ── Public API ──────────────────────────────────────────────

    /**
     * Get the latest crypto news from all sources.
     * @param limit 1–50 articles
     */
    fun getLatest(limit: Int = 10): List<NewsArticle> =
        articlesFrom("/api/news?limit=$limit")

    /**
     * Get the latest news filtered by source key.
     * @param limit  1–50 articles
     * @param source Source key, e.g. "coindesk", "cointelegraph"
     */
    fun getLatest(limit: Int, source: String): List<NewsArticle> =
        articlesFrom("/api/news?limit=$limit&source=${encode(source)}")

    /**
     * Full-text news search.
     * @param keywords Search terms
     * @param limit    1–30 articles
     */
    fun search(keywords: String, limit: Int = 10): List<NewsArticle> =
        articlesFrom("/api/search?q=${encode(keywords)}&limit=$limit")

    /** Get DeFi-specific news. */
    fun getDefi(limit: Int = 10): List<NewsArticle> =
        articlesFrom("/api/defi?limit=$limit")

    /** Get Bitcoin-specific news. */
    fun getBitcoin(limit: Int = 10): List<NewsArticle> =
        articlesFrom("/api/bitcoin?limit=$limit")

    /** Get breaking news from the last 2 hours. */
    fun getBreaking(limit: Int = 5): List<NewsArticle> =
        articlesFrom("/api/breaking?limit=$limit")

    /** Get the list of all news sources. */
    fun getSources(): List<SourceInfo> =
        gson.fromJson(get("/api/sources"), SourcesResponse::class.java).sources
}
