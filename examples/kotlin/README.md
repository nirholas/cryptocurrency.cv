# Kotlin Examples

Comprehensive Kotlin examples for Android, JVM, and Kotlin Multiplatform.

## Requirements

- Kotlin 1.9+
- JDK 17+

## Quick Start

### Gradle

```bash
cd examples/kotlin
./gradlew run
```

### Dependencies

```kotlin
dependencies {
    implementation("io.ktor:ktor-client-core:2.3.7")
    implementation("io.ktor:ktor-client-cio:2.3.7")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

## Usage

### Basic Client

```kotlin
import com.freecryptonews.CryptoNewsClient
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val client = CryptoNewsClient()

    // Get latest news
    val news = client.getNews(10)
    news.forEach { println("📰 ${it.title}") }

    // Get Fear & Greed Index
    val fg = client.getFearGreed()
    println("😰 ${fg.classification}: ${fg.value}")

    // Get Bitcoin sentiment
    val sentiment = client.getSentiment("BTC")
    println("🎯 ${sentiment.label}")

    // Search news
    val results = client.searchNews("ethereum ETF")

    // Get trading signals
    val signals = client.getSignals()

    // Get whale alerts
    val whales = client.getWhaleAlerts()

    client.close()
}
```

### WebSocket Streaming

```kotlin
import com.freecryptonews.CryptoNewsStream
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val stream = CryptoNewsStream()

    stream.onConnect = { println("🔌 Connected!") }
    stream.onNews = { article -> println("📰 ${article.title}") }
    stream.onPrice = { price -> println("💹 ${price.symbol}: $${price.price}") }
    stream.onWhale = { whale -> println("🐋 ${whale.symbol}: $${whale.usdValue}") }
    stream.onError = { e -> println("Error: ${e.message}") }

    stream.connect(listOf("news", "prices", "whales"))
}
```

### Android ViewModel

```kotlin
class NewsViewModel : ViewModel() {
    private val client = CryptoNewsClient()
    
    private val _articles = MutableStateFlow<List<NewsArticle>>(emptyList())
    val articles: StateFlow<List<NewsArticle>> = _articles

    fun loadNews() {
        viewModelScope.launch {
            _articles.value = client.getNews(20)
        }
    }
}
```

### Jetpack Compose

```kotlin
@Composable
fun NewsScreen(viewModel: NewsViewModel = viewModel()) {
    val articles by viewModel.articles.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadNews()
    }
    
    LazyColumn {
        items(articles) { article ->
            Text(
                text = article.title,
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
```

## Available Methods

### News
| Method | Description |
|--------|-------------|
| `getNews(limit, source)` | Get latest news |
| `searchNews(query, limit)` | Search news |
| `getBitcoinNews(limit)` | Bitcoin-specific news |
| `getBreakingNews()` | Breaking news only |
| `getTrending(hours)` | Trending topics |

### Market
| Method | Description |
|--------|-------------|
| `getFearGreed()` | Fear & Greed Index |
| `getPrices(symbols)` | Current prices |

### AI
| Method | Description |
|--------|-------------|
| `getSentiment(asset)` | Sentiment analysis |
| `getDigest()` | AI-generated digest |
| `ask(question)` | Ask AI about crypto |

### Trading
| Method | Description |
|--------|-------------|
| `getSignals(limit)` | Trading signals |
| `getWhaleAlerts(limit)` | Large transactions |

## Android Setup

Add to your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.ktor:ktor-client-android:2.3.7")
    // ... other dependencies
}

android {
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}
```

Add internet permission to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## License

MIT
