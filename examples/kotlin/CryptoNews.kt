/**
 * Free Crypto News - Kotlin Examples
 * 
 * Comprehensive examples for Android, JVM, and Kotlin Multiplatform.
 * 
 * Dependencies:
 *   implementation("io.ktor:ktor-client-core:2.3.0")
 *   implementation("io.ktor:ktor-client-cio:2.3.0")
 *   implementation("io.ktor:ktor-client-content-negotiation:2.3.0")
 *   implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.0")
 *   implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.0")
 */

package com.freecryptonews

import kotlinx.coroutines.*
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*

// ═══════════════════════════════════════════════════════════════
// Models
// ═══════════════════════════════════════════════════════════════

@Serializable
data class NewsArticle(
    val title: String,
    val link: String,
    val source: String,
    val description: String? = null,
    val timeAgo: String? = null,
    val pubDate: String? = null,
    val tickers: List<String>? = null
)

@Serializable
data class NewsResponse(
    val data: List<NewsArticle>,
    val total: Int,
    val success: Boolean
)

@Serializable
data class FearGreedData(
    val value: Int,
    val classification: String,
    val timestamp: String? = null
)

@Serializable
data class FearGreedResponse(
    val data: FearGreedData
)

@Serializable
data class SentimentData(
    val asset: String,
    val label: String,
    val score: Double,
    val confidence: Double,
    val articlesAnalyzed: Int? = null
)

@Serializable
data class TrendingTopic(
    val topic: String,
    val count: Int,
    val sentiment: String? = null,
    val change: Double? = null
)

@Serializable
data class TrendingResponse(
    val data: List<TrendingTopic>
)

@Serializable
data class WhaleAlert(
    val symbol: String,
    val amount: Double,
    val usdValue: Double,
    val fromLabel: String,
    val toLabel: String,
    val type: String,
    val blockchain: String,
    val timeAgo: String? = null
)

@Serializable
data class WhalesResponse(
    val data: List<WhaleAlert>
)

@Serializable
data class TradingSignal(
    val symbol: String,
    val action: String,
    val price: Double,
    val confidence: Double,
    val reason: String? = null,
    val targets: SignalTargets? = null
)

@Serializable
data class SignalTargets(
    val takeProfit: Double,
    val stopLoss: Double
)

@Serializable
data class SignalsResponse(
    val data: List<TradingSignal>
)

@Serializable
data class CoinPrice(
    val symbol: String,
    val name: String,
    val price: Double,
    val change24h: Double,
    val marketCap: Double,
    val volume24h: Double
)

// ═══════════════════════════════════════════════════════════════
// Client
// ═══════════════════════════════════════════════════════════════

class CryptoNewsClient(
    private val apiKey: String? = null,
    private val baseUrl: String = "https://cryptocurrency.cv"
) {
    private val json = Json { 
        ignoreUnknownKeys = true 
        isLenient = true
    }
    
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(json)
        }
        install(WebSockets)
    }

    // ─────────────────────────────────────────────────────────────
    // News Endpoints
    // ─────────────────────────────────────────────────────────────

    suspend fun getNews(limit: Int = 20, source: String? = null): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/news") {
            parameter("limit", limit)
            source?.let { parameter("source", it) }
            apiKey?.let { header("Authorization", "Bearer $it") }
        }.body()
        return response.data
    }

    suspend fun searchNews(query: String, limit: Int = 20): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/search") {
            parameter("q", query)
            parameter("limit", limit)
        }.body()
        return response.data
    }

    suspend fun getBitcoinNews(limit: Int = 20): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/bitcoin") {
            parameter("limit", limit)
        }.body()
        return response.data
    }

    suspend fun getBreakingNews(): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/breaking").body()
        return response.data
    }

    suspend fun getTrending(hours: Int = 24): List<TrendingTopic> {
        val response: TrendingResponse = client.get("$baseUrl/api/trending") {
            parameter("hours", hours)
        }.body()
        return response.data
    }

    // ─────────────────────────────────────────────────────────────
    // Market Endpoints
    // ─────────────────────────────────────────────────────────────

    suspend fun getFearGreed(): FearGreedData {
        val response: FearGreedResponse = client.get("$baseUrl/api/market/fear-greed").body()
        return response.data
    }

    suspend fun getPrices(symbols: List<String>): List<CoinPrice> {
        val response: Map<String, List<CoinPrice>> = client.get("$baseUrl/api/prices") {
            parameter("symbols", symbols.joinToString(","))
        }.body()
        return response["data"] ?: emptyList()
    }

    // ─────────────────────────────────────────────────────────────
    // AI Endpoints
    // ─────────────────────────────────────────────────────────────

    suspend fun getSentiment(asset: String): SentimentData {
        return client.get("$baseUrl/api/ai/sentiment") {
            parameter("asset", asset)
        }.body()
    }

    suspend fun getDigest(): String {
        val response: Map<String, String> = client.get("$baseUrl/api/ai/digest").body()
        return response["digest"] ?: ""
    }

    suspend fun ask(question: String): String {
        val response: Map<String, String> = client.get("$baseUrl/api/ai/ask") {
            parameter("q", question)
        }.body()
        return response["answer"] ?: ""
    }

    // ─────────────────────────────────────────────────────────────
    // Trading Endpoints
    // ─────────────────────────────────────────────────────────────

    suspend fun getSignals(limit: Int = 10): List<TradingSignal> {
        val response: SignalsResponse = client.get("$baseUrl/api/trading/signals") {
            parameter("limit", limit)
        }.body()
        return response.data
    }

    suspend fun getWhaleAlerts(limit: Int = 20): List<WhaleAlert> {
        val response: WhalesResponse = client.get("$baseUrl/api/whales") {
            parameter("limit", limit)
        }.body()
        return response.data
    }

    fun close() {
        client.close()
    }
}

// ═══════════════════════════════════════════════════════════════
// WebSocket Streaming
// ═══════════════════════════════════════════════════════════════

class CryptoNewsStream(
    private val baseUrl: String = "wss://cryptocurrency.cv"
) {
    private val client = HttpClient(CIO) {
        install(WebSockets)
    }
    
    private val json = Json { ignoreUnknownKeys = true }
    
    var onNews: ((NewsArticle) -> Unit)? = null
    var onPrice: ((CoinPrice) -> Unit)? = null
    var onWhale: ((WhaleAlert) -> Unit)? = null
    var onError: ((Throwable) -> Unit)? = null
    var onConnect: (() -> Unit)? = null
    var onDisconnect: (() -> Unit)? = null

    suspend fun connect(channels: List<String> = listOf("news")) {
        try {
            client.webSocket("$baseUrl/api/ws") {
                onConnect?.invoke()
                
                // Subscribe to channels
                for (channel in channels) {
                    send("""{"action": "subscribe", "channel": "$channel"}""")
                }
                
                // Receive messages
                for (frame in incoming) {
                    when (frame) {
                        is Frame.Text -> handleMessage(frame.readText())
                        else -> {}
                    }
                }
            }
        } catch (e: Exception) {
            onError?.invoke(e)
        } finally {
            onDisconnect?.invoke()
        }
    }

    private fun handleMessage(text: String) {
        try {
            val element = json.parseToJsonElement(text).jsonObject
            val type = element["type"]?.jsonPrimitive?.content
            val data = element["data"]

            when (type) {
                "news" -> {
                    data?.let {
                        val article = json.decodeFromJsonElement<NewsArticle>(it)
                        onNews?.invoke(article)
                    }
                }
                "price" -> {
                    data?.let {
                        val price = json.decodeFromJsonElement<CoinPrice>(it)
                        onPrice?.invoke(price)
                    }
                }
                "whale" -> {
                    data?.let {
                        val whale = json.decodeFromJsonElement<WhaleAlert>(it)
                        onWhale?.invoke(whale)
                    }
                }
            }
        } catch (e: Exception) {
            onError?.invoke(e)
        }
    }

    fun close() {
        client.close()
    }
}

// ═══════════════════════════════════════════════════════════════
// Android ViewModel Example
// ═══════════════════════════════════════════════════════════════

/*
// For Android, use with Jetpack Compose:

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class NewsViewModel : ViewModel() {
    private val client = CryptoNewsClient()
    
    private val _articles = MutableStateFlow<List<NewsArticle>>(emptyList())
    val articles: StateFlow<List<NewsArticle>> = _articles
    
    private val _fearGreed = MutableStateFlow<FearGreedData?>(null)
    val fearGreed: StateFlow<FearGreedData?> = _fearGreed
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun loadNews() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                _articles.value = client.getNews(20)
                _fearGreed.value = client.getFearGreed()
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        client.close()
    }
}

// Composable:
@Composable
fun NewsScreen(viewModel: NewsViewModel = viewModel()) {
    val articles by viewModel.articles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadNews()
    }
    
    if (isLoading) {
        CircularProgressIndicator()
    } else {
        LazyColumn {
            items(articles) { article ->
                Text(article.title)
            }
        }
    }
}
*/

// ═══════════════════════════════════════════════════════════════
// Examples
// ═══════════════════════════════════════════════════════════════

suspend fun main() {
    println("═══════════════════════════════════════════════════════")
    println("       Free Crypto News - Kotlin Examples")
    println("═══════════════════════════════════════════════════════\n")

    val client = CryptoNewsClient()

    try {
        // News
        println("📰 Latest News:")
        println("─────────────────────────────────────────────────────────")
        val news = client.getNews(5)
        news.forEach { article ->
            println("  • ${article.title}")
            println("    ${article.source} | ${article.timeAgo ?: ""}")
        }

        // Fear & Greed
        println("\n😰 Fear & Greed Index:")
        println("─────────────────────────────────────────────────────────")
        val fg = client.getFearGreed()
        println("  Value: ${fg.value}")
        println("  Classification: ${fg.classification}")

        // Sentiment
        println("\n🎯 Bitcoin Sentiment:")
        println("─────────────────────────────────────────────────────────")
        val sentiment = client.getSentiment("BTC")
        println("  Label: ${sentiment.label}")
        println("  Score: ${"%.2f".format(sentiment.score)}")

        // Trending
        println("\n🔥 Trending Topics:")
        println("─────────────────────────────────────────────────────────")
        val trending = client.getTrending()
        trending.take(5).forEach { topic ->
            val emoji = when (topic.sentiment) {
                "bullish" -> "🟢"
                "bearish" -> "🔴"
                else -> "⚪"
            }
            println("  $emoji ${topic.topic} (${topic.count} mentions)")
        }

        // Trading Signals
        println("\n📊 Trading Signals:")
        println("─────────────────────────────────────────────────────────")
        val signals = client.getSignals(3)
        signals.forEach { signal ->
            val emoji = if (signal.action in listOf("buy", "long")) "🟢" else "🔴"
            println("  $emoji ${signal.action.uppercase()} ${signal.symbol} @ $${String.format("%.2f", signal.price)}")
        }

        // Whale Alerts
        println("\n🐋 Whale Alerts:")
        println("─────────────────────────────────────────────────────────")
        val whales = client.getWhaleAlerts(5)
        whales.forEach { whale ->
            val emoji = when (whale.type) {
                "exchange_inflow" -> "📥"
                "exchange_outflow" -> "📤"
                else -> "🔄"
            }
            println("  $emoji ${whale.symbol}: $${"%,.0f".format(whale.usdValue)}")
        }

        // Search
        println("\n🔍 Search 'ethereum ETF':")
        println("─────────────────────────────────────────────────────────")
        val searchResults = client.searchNews("ethereum ETF", 3)
        searchResults.forEach { article ->
            println("  • ${article.title}")
        }

    } catch (e: Exception) {
        println("Error: ${e.message}")
    } finally {
        client.close()
    }

    println("\n═══════════════════════════════════════════════════════")
    println("       Examples Complete!")
    println("═══════════════════════════════════════════════════════")
}
