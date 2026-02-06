# Kotlin Examples

Build Android apps and JVM applications with Free Crypto News.

## Overview

Production-ready Kotlin client with coroutines and Kotlin Serialization.

| Feature | Support |
|---------|---------|
| **Platforms** | Android, JVM, Kotlin Multiplatform |
| **Async** | Kotlin Coroutines |
| **HTTP** | Ktor Client |
| **Serialization** | Kotlinx Serialization |

## Installation

### Gradle (Kotlin DSL)

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.ktor:ktor-client-core:2.3.0")
    implementation("io.ktor:ktor-client-cio:2.3.0")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.0")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.0")
}
```

### Android

```kotlin
// For Android, use OkHttp engine instead of CIO
implementation("io.ktor:ktor-client-okhttp:2.3.0")
```

---

## Models

```kotlin
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
data class FearGreedData(
    val value: Int,
    val classification: String,
    val timestamp: String? = null
)

@Serializable
data class SentimentData(
    val asset: String,
    val label: String,          // "bullish", "bearish", "neutral"
    val score: Double,          // -1.0 to 1.0
    val confidence: Double,     // 0.0 to 1.0
    val articlesAnalyzed: Int? = null
)

@Serializable
data class TradingSignal(
    val symbol: String,
    val action: String,         // "buy", "sell", "hold"
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
data class CoinPrice(
    val symbol: String,
    val name: String,
    val price: Double,
    val change24h: Double,
    val marketCap: Double,
    val volume24h: Double
)
```

---

## API Client

```kotlin
class CryptoNewsClient(
    private val baseUrl: String = "https://cryptocurrency.cv",
    private val apiKey: String? = null
) {
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        install(WebSockets)
        
        defaultRequest {
            apiKey?.let {
                header("X-API-Key", it)
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // News
    // ═══════════════════════════════════════════════════════════════
    
    suspend fun getNews(
        limit: Int = 20,
        ticker: String? = null,
        source: String? = null
    ): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/news") {
            parameter("limit", limit)
            ticker?.let { parameter("ticker", it) }
            source?.let { parameter("source", it) }
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

    suspend fun getBreaking(): List<NewsArticle> {
        val response: NewsResponse = client.get("$baseUrl/api/breaking").body()
        return response.data
    }

    // ═══════════════════════════════════════════════════════════════
    // Market Data
    // ═══════════════════════════════════════════════════════════════

    suspend fun getFearGreed(): FearGreedData {
        val response: FearGreedResponse = client.get("$baseUrl/api/fear-greed").body()
        return response.data
    }

    suspend fun getSentiment(asset: String): SentimentData {
        return client.get("$baseUrl/api/ai/sentiment") {
            parameter("asset", asset)
        }.body()
    }

    suspend fun getTrending(limit: Int = 10): List<TrendingTopic> {
        val response: TrendingResponse = client.get("$baseUrl/api/trending") {
            parameter("limit", limit)
        }.body()
        return response.data
    }

    // ═══════════════════════════════════════════════════════════════
    // Trading
    // ═══════════════════════════════════════════════════════════════

    suspend fun getSignals(asset: String? = null): List<TradingSignal> {
        return client.get("$baseUrl/api/signals") {
            asset?.let { parameter("asset", it) }
        }.body()
    }

    suspend fun getWhales(minAmount: Double? = null): List<WhaleAlert> {
        val response: WhalesResponse = client.get("$baseUrl/api/whales") {
            minAmount?.let { parameter("min", it) }
        }.body()
        return response.data
    }

    suspend fun getPrices(symbols: List<String>): List<CoinPrice> {
        return client.get("$baseUrl/api/market/coins") {
            parameter("ids", symbols.joinToString(","))
        }.body()
    }

    // ═══════════════════════════════════════════════════════════════
    // Real-time Streaming
    // ═══════════════════════════════════════════════════════════════

    fun streamNews(): Flow<NewsArticle> = flow {
        client.webSocket("$baseUrl/ws") {
            for (frame in incoming) {
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        val article = Json.decodeFromString<NewsArticle>(text)
                        emit(article)
                    }
                    else -> {}
                }
            }
        }
    }

    fun close() {
        client.close()
    }
}
```

---

## Android Examples

### ViewModel with StateFlow

```kotlin
class NewsViewModel(
    private val client: CryptoNewsClient = CryptoNewsClient()
) : ViewModel() {
    
    private val _articles = MutableStateFlow<List<NewsArticle>>(emptyList())
    val articles: StateFlow<List<NewsArticle>> = _articles.asStateFlow()
    
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    
    private val _fearGreed = MutableStateFlow<FearGreedData?>(null)
    val fearGreed: StateFlow<FearGreedData?> = _fearGreed.asStateFlow()
    
    init {
        loadNews()
        loadFearGreed()
    }
    
    fun loadNews(ticker: String? = null) {
        viewModelScope.launch {
            _loading.value = true
            try {
                _articles.value = client.getNews(limit = 30, ticker = ticker)
            } catch (e: Exception) {
                Log.e("NewsViewModel", "Failed to load news", e)
            } finally {
                _loading.value = false
            }
        }
    }
    
    fun search(query: String) {
        viewModelScope.launch {
            _loading.value = true
            try {
                _articles.value = client.searchNews(query)
            } catch (e: Exception) {
                Log.e("NewsViewModel", "Search failed", e)
            } finally {
                _loading.value = false
            }
        }
    }
    
    private fun loadFearGreed() {
        viewModelScope.launch {
            try {
                _fearGreed.value = client.getFearGreed()
            } catch (e: Exception) {
                Log.e("NewsViewModel", "Failed to load Fear & Greed", e)
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        client.close()
    }
}
```

### Jetpack Compose UI

```kotlin
@Composable
fun NewsFeedScreen(viewModel: NewsViewModel = viewModel()) {
    val articles by viewModel.articles.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val fearGreed by viewModel.fearGreed.collectAsState()
    
    var searchQuery by remember { mutableStateOf("") }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Fear & Greed Header
        fearGreed?.let { data ->
            FearGreedBanner(data)
        }
        
        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            placeholder = { Text("Search crypto news...") },
            trailingIcon = {
                IconButton(onClick = { viewModel.search(searchQuery) }) {
                    Icon(Icons.Default.Search, "Search")
                }
            },
            singleLine = true
        )
        
        // News List
        if (loading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn {
                items(articles) { article ->
                    NewsCard(article)
                }
            }
        }
    }
}

@Composable
fun NewsCard(article: NewsArticle) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = article.title,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = article.source,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
                article.timeAgo?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun FearGreedBanner(data: FearGreedData) {
    val color = when {
        data.value < 25 -> Color.Red
        data.value < 45 -> Color(0xFFFF9800)
        data.value < 55 -> Color.Gray
        data.value < 75 -> Color(0xFF4CAF50)
        else -> Color(0xFF00E676)
    }
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Fear & Greed Index",
                    style = MaterialTheme.typography.labelMedium
                )
                Text(
                    text = data.classification,
                    style = MaterialTheme.typography.bodyMedium,
                    color = color
                )
            }
            Text(
                text = "${data.value}",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

@Composable
fun SentimentChip(asset: String) {
    var sentiment by remember { mutableStateOf<SentimentData?>(null) }
    val client = remember { CryptoNewsClient() }
    
    LaunchedEffect(asset) {
        sentiment = client.getSentiment(asset)
    }
    
    sentiment?.let { data ->
        val color = when (data.label) {
            "bullish" -> Color.Green
            "bearish" -> Color.Red
            else -> Color.Gray
        }
        
        AssistChip(
            onClick = {},
            label = {
                Text("${data.label.uppercase()} ${(data.confidence * 100).toInt()}%")
            },
            leadingIcon = {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(color, CircleShape)
                )
            }
        )
    }
}
```

### Real-Time Updates

```kotlin
@Composable
fun LiveNewsFeed(viewModel: NewsViewModel = viewModel()) {
    val scope = rememberCoroutineScope()
    var liveArticles by remember { mutableStateOf<List<NewsArticle>>(emptyList()) }
    
    LaunchedEffect(Unit) {
        val client = CryptoNewsClient()
        client.streamNews()
            .catch { e -> Log.e("LiveFeed", "Stream error", e) }
            .collect { article ->
                liveArticles = listOf(article) + liveArticles.take(49)
            }
    }
    
    LazyColumn {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Live Feed", style = MaterialTheme.typography.titleLarge)
                Text(
                    "🔴 LIVE",
                    color = Color.Red,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        items(liveArticles) { article ->
            NewsCard(article)
        }
    }
}
```

---

## Kotlin Multiplatform

```kotlin
// commonMain
expect class CryptoNewsClient {
    suspend fun getNews(limit: Int): List<NewsArticle>
    suspend fun getFearGreed(): FearGreedData
}

// androidMain
actual class CryptoNewsClient {
    private val client = HttpClient(OkHttp) { /* config */ }
    // ... implementation
}

// iosMain
actual class CryptoNewsClient {
    private val client = HttpClient(Darwin) { /* config */ }
    // ... implementation
}

// jvmMain
actual class CryptoNewsClient {
    private val client = HttpClient(CIO) { /* config */ }
    // ... implementation
}
```

---

## Related

- [Android Mobile App](../integrations/mobile.md)
- [React Native](react.md)
- [API Reference](../API.md)
