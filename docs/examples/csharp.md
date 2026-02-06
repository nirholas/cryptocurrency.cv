# C# Examples

Build .NET applications with Free Crypto News.

## Overview

Production-ready C# client for all .NET platforms.

| Feature | Support |
|---------|---------|
| **Platforms** | .NET 6+, .NET Core, .NET Framework 4.7+ |
| **Async** | Task-based async/await |
| **HTTP** | HttpClient, System.Net.Http.Json |
| **Serialization** | System.Text.Json |

## Installation

```bash
dotnet add package System.Net.Http.Json
dotnet add package System.Text.Json
```

---

## Models

```csharp
public record NewsArticle(
    string Title,
    string Link,
    string Source,
    string? Description,
    string TimeAgo,
    DateTime PubDate,
    List<string>? Tickers
);

public record NewsResponse(
    List<NewsArticle> Data,
    int Total,
    bool Success
);

public record FearGreedResponse(
    int Value,
    string Classification,
    DateTime Timestamp
);

public record SentimentResponse(
    string Asset,
    string Label,
    double Score,
    double Confidence,
    int ArticlesAnalyzed
);

public record TrendingTopic(
    string Topic,
    int Count,
    string? Sentiment,
    double? Change
);

public record WhaleAlert(
    string Symbol,
    double Amount,
    double UsdValue,
    string FromLabel,
    string ToLabel,
    string Type,
    string Blockchain,
    string TimeAgo
);

public record TradingSignal(
    string Symbol,
    string Action,
    double Price,
    double Confidence,
    string? Reason,
    SignalTargets? Targets
);

public record SignalTargets(
    double TakeProfit,
    double StopLoss
);

public record CoinPrice(
    string Symbol,
    string Name,
    double Price,
    double Change24h,
    double MarketCap,
    double Volume24h
);
```

---

## API Client

```csharp
public class CryptoNewsClient : IDisposable
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public CryptoNewsClient(string? apiKey = null, string baseUrl = "https://cryptocurrency.cv")
    {
        _baseUrl = baseUrl;
        _client = new HttpClient();
        
        if (!string.IsNullOrEmpty(apiKey))
        {
            _client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        }
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // News
    // ═══════════════════════════════════════════════════════════════

    public async Task<List<NewsArticle>> GetNewsAsync(
        int limit = 20,
        string? ticker = null,
        string? source = null)
    {
        var query = $"?limit={limit}";
        if (!string.IsNullOrEmpty(ticker)) query += $"&ticker={ticker}";
        if (!string.IsNullOrEmpty(source)) query += $"&source={source}";
        
        var response = await _client.GetFromJsonAsync<NewsResponse>(
            $"{_baseUrl}/api/news{query}", _jsonOptions);
        return response?.Data ?? new List<NewsArticle>();
    }

    public async Task<List<NewsArticle>> SearchAsync(string query, int limit = 20)
    {
        var encodedQuery = Uri.EscapeDataString(query);
        var response = await _client.GetFromJsonAsync<NewsResponse>(
            $"{_baseUrl}/api/search?q={encodedQuery}&limit={limit}", _jsonOptions);
        return response?.Data ?? new List<NewsArticle>();
    }

    public async Task<List<NewsArticle>> GetBreakingAsync()
    {
        var response = await _client.GetFromJsonAsync<NewsResponse>(
            $"{_baseUrl}/api/breaking", _jsonOptions);
        return response?.Data ?? new List<NewsArticle>();
    }

    // ═══════════════════════════════════════════════════════════════
    // Market Data
    // ═══════════════════════════════════════════════════════════════

    public async Task<FearGreedResponse?> GetFearGreedAsync()
    {
        return await _client.GetFromJsonAsync<FearGreedResponse>(
            $"{_baseUrl}/api/fear-greed", _jsonOptions);
    }

    public async Task<SentimentResponse?> GetSentimentAsync(string asset)
    {
        return await _client.GetFromJsonAsync<SentimentResponse>(
            $"{_baseUrl}/api/ai/sentiment?asset={asset}", _jsonOptions);
    }

    public async Task<List<TrendingTopic>> GetTrendingAsync(int limit = 10)
    {
        var response = await _client.GetFromJsonAsync<TrendingResponse>(
            $"{_baseUrl}/api/trending?limit={limit}", _jsonOptions);
        return response?.Data ?? new List<TrendingTopic>();
    }

    // ═══════════════════════════════════════════════════════════════
    // Trading
    // ═══════════════════════════════════════════════════════════════

    public async Task<List<TradingSignal>> GetSignalsAsync(string? asset = null)
    {
        var url = $"{_baseUrl}/api/signals";
        if (!string.IsNullOrEmpty(asset)) url += $"?asset={asset}";
        
        return await _client.GetFromJsonAsync<List<TradingSignal>>(url, _jsonOptions)
            ?? new List<TradingSignal>();
    }

    public async Task<List<WhaleAlert>> GetWhalesAsync(double? minAmount = null)
    {
        var url = $"{_baseUrl}/api/whales";
        if (minAmount.HasValue) url += $"?min={minAmount}";
        
        var response = await _client.GetFromJsonAsync<WhalesResponse>(url, _jsonOptions);
        return response?.Data ?? new List<WhaleAlert>();
    }

    public async Task<List<CoinPrice>> GetPricesAsync(params string[] symbols)
    {
        var ids = string.Join(",", symbols);
        return await _client.GetFromJsonAsync<List<CoinPrice>>(
            $"{_baseUrl}/api/market/coins?ids={ids}", _jsonOptions)
            ?? new List<CoinPrice>();
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}
```

---

## Console Application

```csharp
using FreeCryptoNews;

class Program
{
    static async Task Main(string[] args)
    {
        using var client = new CryptoNewsClient();
        
        Console.WriteLine("=== Free Crypto News ===\n");
        
        // Fear & Greed Index
        var fearGreed = await client.GetFearGreedAsync();
        if (fearGreed != null)
        {
            Console.WriteLine($"Fear & Greed: {fearGreed.Value} ({fearGreed.Classification})");
        }
        
        Console.WriteLine();
        
        // Latest news
        Console.WriteLine("📰 Latest News:");
        var news = await client.GetNewsAsync(limit: 10);
        foreach (var (article, i) in news.Select((a, i) => (a, i + 1)))
        {
            Console.WriteLine($"  {i}. {article.Title}");
            Console.WriteLine($"     {article.Source} • {article.TimeAgo}");
        }
        
        Console.WriteLine();
        
        // Bitcoin sentiment
        var sentiment = await client.GetSentimentAsync("BTC");
        if (sentiment != null)
        {
            Console.WriteLine($"BTC Sentiment: {sentiment.Label.ToUpper()} " +
                $"(score: {sentiment.Score:F2}, confidence: {sentiment.Confidence:P0})");
        }
        
        Console.WriteLine();
        
        // Whale alerts
        Console.WriteLine("🐋 Whale Alerts (>$1M):");
        var whales = await client.GetWhalesAsync(minAmount: 1_000_000);
        foreach (var whale in whales.Take(5))
        {
            Console.WriteLine($"  {whale.Symbol}: ${whale.UsdValue:N0}");
            Console.WriteLine($"    {whale.FromLabel} → {whale.ToLabel} ({whale.TimeAgo})");
        }
        
        Console.WriteLine();
        
        // Trading signals
        Console.WriteLine("📊 Trading Signals:");
        var signals = await client.GetSignalsAsync();
        foreach (var signal in signals.Take(5))
        {
            var icon = signal.Action switch
            {
                "buy" => "🟢",
                "sell" => "🔴",
                _ => "⚪"
            };
            Console.WriteLine($"  {icon} {signal.Symbol}: {signal.Action.ToUpper()} @ ${signal.Price:N2}");
            Console.WriteLine($"     Confidence: {signal.Confidence:P0} - {signal.Reason}");
        }
    }
}
```

---

## ASP.NET Core Integration

### Service Registration

```csharp
// Program.cs
builder.Services.AddHttpClient<CryptoNewsClient>(client =>
{
    client.BaseAddress = new Uri("https://cryptocurrency.cv");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

builder.Services.AddScoped<ICryptoNewsService, CryptoNewsService>();
```

### Controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class CryptoController : ControllerBase
{
    private readonly CryptoNewsClient _client;

    public CryptoController(CryptoNewsClient client)
    {
        _client = client;
    }

    [HttpGet("news")]
    public async Task<ActionResult<List<NewsArticle>>> GetNews(
        [FromQuery] int limit = 20,
        [FromQuery] string? ticker = null)
    {
        var articles = await _client.GetNewsAsync(limit, ticker);
        return Ok(articles);
    }

    [HttpGet("sentiment/{asset}")]
    public async Task<ActionResult<SentimentResponse>> GetSentiment(string asset)
    {
        var sentiment = await _client.GetSentimentAsync(asset);
        return sentiment != null ? Ok(sentiment) : NotFound();
    }

    [HttpGet("fear-greed")]
    public async Task<ActionResult<FearGreedResponse>> GetFearGreed()
    {
        var data = await _client.GetFearGreedAsync();
        return data != null ? Ok(data) : StatusCode(503);
    }
}
```

### Blazor Component

```razor
@page "/news"
@inject CryptoNewsClient Client

<h3>Crypto News</h3>

@if (_loading)
{
    <p>Loading...</p>
}
else
{
    <div class="fear-greed-banner">
        @if (_fearGreed != null)
        {
            <span class="value" style="color: @GetFearGreedColor(_fearGreed.Value)">
                @_fearGreed.Value
            </span>
            <span class="label">@_fearGreed.Classification</span>
        }
    </div>

    <div class="search-box">
        <input @bind="_searchQuery" placeholder="Search news..." />
        <button @onclick="Search">Search</button>
    </div>

    <div class="news-list">
        @foreach (var article in _articles)
        {
            <div class="news-card">
                <h4><a href="@article.Link" target="_blank">@article.Title</a></h4>
                <p class="meta">@article.Source • @article.TimeAgo</p>
            </div>
        }
    </div>
}

@code {
    private List<NewsArticle> _articles = new();
    private FearGreedResponse? _fearGreed;
    private string _searchQuery = "";
    private bool _loading = true;

    protected override async Task OnInitializedAsync()
    {
        _fearGreed = await Client.GetFearGreedAsync();
        _articles = await Client.GetNewsAsync(limit: 20);
        _loading = false;
    }

    private async Task Search()
    {
        if (!string.IsNullOrWhiteSpace(_searchQuery))
        {
            _loading = true;
            _articles = await Client.SearchAsync(_searchQuery);
            _loading = false;
        }
    }

    private string GetFearGreedColor(int value) => value switch
    {
        < 25 => "#ef4444",
        < 45 => "#f97316",
        < 55 => "#6b7280",
        < 75 => "#22c55e",
        _ => "#10b981"
    };
}
```

---

## WebSocket Streaming

```csharp
public class NewsStreamService : IDisposable
{
    private ClientWebSocket? _socket;
    private CancellationTokenSource? _cts;
    
    public event EventHandler<NewsArticle>? OnNewsReceived;

    public async Task ConnectAsync(string url = "wss://cryptocurrency.cv/ws")
    {
        _socket = new ClientWebSocket();
        _cts = new CancellationTokenSource();
        
        await _socket.ConnectAsync(new Uri(url), _cts.Token);
        
        _ = ReceiveLoopAsync();
    }

    private async Task ReceiveLoopAsync()
    {
        var buffer = new byte[4096];
        
        while (_socket?.State == WebSocketState.Open)
        {
            try
            {
                var result = await _socket.ReceiveAsync(buffer, _cts!.Token);
                
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    var article = JsonSerializer.Deserialize<NewsArticle>(json);
                    
                    if (article != null)
                    {
                        OnNewsReceived?.Invoke(this, article);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"WebSocket error: {ex.Message}");
            }
        }
    }

    public async Task DisconnectAsync()
    {
        _cts?.Cancel();
        
        if (_socket?.State == WebSocketState.Open)
        {
            await _socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Closing",
                CancellationToken.None);
        }
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _socket?.Dispose();
        _cts?.Dispose();
    }
}

// Usage
var stream = new NewsStreamService();
stream.OnNewsReceived += (_, article) =>
{
    Console.WriteLine($"📰 {article.Title}");
};
await stream.ConnectAsync();
```

---

## MAUI Application

```csharp
// MainPage.xaml.cs
public partial class MainPage : ContentPage
{
    private readonly CryptoNewsClient _client = new();
    private ObservableCollection<NewsArticle> Articles { get; } = new();

    public MainPage()
    {
        InitializeComponent();
        BindingContext = this;
        LoadNews();
    }

    private async void LoadNews()
    {
        try
        {
            var news = await _client.GetNewsAsync(limit: 30);
            foreach (var article in news)
            {
                Articles.Add(article);
            }
        }
        catch (Exception ex)
        {
            await DisplayAlert("Error", ex.Message, "OK");
        }
    }

    private async void OnRefresh(object sender, EventArgs e)
    {
        Articles.Clear();
        await LoadNews();
        RefreshView.IsRefreshing = false;
    }
}
```

---

## Related

- [React Examples](react.md)
- [API Reference](../API.md)
- [Real-Time API](../REALTIME.md)
