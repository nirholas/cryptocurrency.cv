/**
 * Free Crypto News - C# Examples
 * 
 * Comprehensive examples for all API endpoints.
 * 
 * Requirements:
 *   dotnet add package System.Net.Http.Json
 *   dotnet add package System.Text.Json
 */

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Net.WebSockets;
using System.Text;
using System.Threading;

namespace FreeCryptoNews;

// ═══════════════════════════════════════════════════════════════
// Models
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// Client
// ═══════════════════════════════════════════════════════════════

public class CryptoNewsClient : IDisposable
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public CryptoNewsClient(string? apiKey = null, string baseUrl = "https://news-crypto.vercel.app")
    {
        _baseUrl = baseUrl;
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Add("User-Agent", "FCN-CSharp/1.0");
        
        if (!string.IsNullOrEmpty(apiKey))
        {
            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        }

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    // ─────────────────────────────────────────────────────────────
    // News Endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<NewsResponse> GetNewsAsync(int limit = 20, string? source = null)
    {
        var url = $"{_baseUrl}/api/news?limit={limit}";
        if (!string.IsNullOrEmpty(source)) url += $"&source={source}";
        
        return await _http.GetFromJsonAsync<NewsResponse>(url, _jsonOptions) 
            ?? throw new Exception("Failed to fetch news");
    }

    public async Task<NewsResponse> SearchNewsAsync(string query, int limit = 20)
    {
        var url = $"{_baseUrl}/api/search?q={Uri.EscapeDataString(query)}&limit={limit}";
        return await _http.GetFromJsonAsync<NewsResponse>(url, _jsonOptions)
            ?? throw new Exception("Failed to search news");
    }

    public async Task<NewsResponse> GetBitcoinNewsAsync(int limit = 20)
    {
        return await _http.GetFromJsonAsync<NewsResponse>(
            $"{_baseUrl}/api/bitcoin?limit={limit}", _jsonOptions)
            ?? throw new Exception("Failed to fetch Bitcoin news");
    }

    public async Task<NewsResponse> GetBreakingNewsAsync()
    {
        return await _http.GetFromJsonAsync<NewsResponse>(
            $"{_baseUrl}/api/breaking", _jsonOptions)
            ?? throw new Exception("Failed to fetch breaking news");
    }

    public async Task<List<TrendingTopic>> GetTrendingAsync(int hours = 24)
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/trending?hours={hours}", _jsonOptions);
        return response.GetProperty("data").Deserialize<List<TrendingTopic>>(_jsonOptions)
            ?? new List<TrendingTopic>();
    }

    // ─────────────────────────────────────────────────────────────
    // Market Endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<FearGreedResponse> GetFearGreedAsync()
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/market/fear-greed", _jsonOptions);
        return response.GetProperty("data").Deserialize<FearGreedResponse>(_jsonOptions)
            ?? throw new Exception("Failed to fetch Fear & Greed");
    }

    public async Task<List<CoinPrice>> GetPricesAsync(string[] symbols)
    {
        var symbolsParam = string.Join(",", symbols);
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/prices?symbols={symbolsParam}", _jsonOptions);
        return response.GetProperty("data").Deserialize<List<CoinPrice>>(_jsonOptions)
            ?? new List<CoinPrice>();
    }

    public async Task<CoinPrice> GetCoinAsync(string symbol)
    {
        return await _http.GetFromJsonAsync<CoinPrice>(
            $"{_baseUrl}/api/coins/{symbol.ToLower()}", _jsonOptions)
            ?? throw new Exception($"Failed to fetch coin {symbol}");
    }

    // ─────────────────────────────────────────────────────────────
    // AI Endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<SentimentResponse> GetSentimentAsync(string asset)
    {
        return await _http.GetFromJsonAsync<SentimentResponse>(
            $"{_baseUrl}/api/ai/sentiment?asset={asset}", _jsonOptions)
            ?? throw new Exception("Failed to fetch sentiment");
    }

    public async Task<string> GetDailyDigestAsync()
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/ai/digest", _jsonOptions);
        return response.GetProperty("digest").GetString() ?? "";
    }

    public async Task<string> AskQuestionAsync(string question)
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/ai/ask?q={Uri.EscapeDataString(question)}", _jsonOptions);
        return response.GetProperty("answer").GetString() ?? "";
    }

    // ─────────────────────────────────────────────────────────────
    // Trading Endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<List<TradingSignal>> GetSignalsAsync(int limit = 10)
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/trading/signals?limit={limit}", _jsonOptions);
        return response.GetProperty("data").Deserialize<List<TradingSignal>>(_jsonOptions)
            ?? new List<TradingSignal>();
    }

    public async Task<List<WhaleAlert>> GetWhaleAlertsAsync(int limit = 20)
    {
        var response = await _http.GetFromJsonAsync<JsonElement>(
            $"{_baseUrl}/api/whales?limit={limit}", _jsonOptions);
        return response.GetProperty("data").Deserialize<List<WhaleAlert>>(_jsonOptions)
            ?? new List<WhaleAlert>();
    }

    public void Dispose()
    {
        _http.Dispose();
    }
}

// ═══════════════════════════════════════════════════════════════
// WebSocket Streaming
// ═══════════════════════════════════════════════════════════════

public class CryptoNewsStream : IDisposable
{
    private ClientWebSocket? _ws;
    private readonly string _wsUrl;
    private CancellationTokenSource? _cts;

    public event Action<NewsArticle>? OnNews;
    public event Action<CoinPrice>? OnPrice;
    public event Action<WhaleAlert>? OnWhale;
    public event Action<Exception>? OnError;

    public CryptoNewsStream(string baseUrl = "wss://news-crypto.vercel.app")
    {
        _wsUrl = $"{baseUrl}/api/ws";
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        _ws = new ClientWebSocket();
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        
        await _ws.ConnectAsync(new Uri(_wsUrl), _cts.Token);
        Console.WriteLine("🔌 Connected to WebSocket");

        _ = ReceiveLoopAsync(_cts.Token);
    }

    public async Task SubscribeAsync(string channel)
    {
        if (_ws?.State != WebSocketState.Open) return;

        var message = JsonSerializer.Serialize(new { action = "subscribe", channel });
        var bytes = Encoding.UTF8.GetBytes(message);
        await _ws.SendAsync(bytes, WebSocketMessageType.Text, true, _cts?.Token ?? default);
    }

    private async Task ReceiveLoopAsync(CancellationToken cancellationToken)
    {
        var buffer = new byte[4096];
        
        while (!cancellationToken.IsCancellationRequested && _ws?.State == WebSocketState.Open)
        {
            try
            {
                var result = await _ws.ReceiveAsync(buffer, cancellationToken);
                
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", cancellationToken);
                    break;
                }

                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                var doc = JsonDocument.Parse(json);
                var type = doc.RootElement.GetProperty("type").GetString();

                switch (type)
                {
                    case "news":
                        var article = doc.RootElement.GetProperty("data")
                            .Deserialize<NewsArticle>();
                        if (article != null) OnNews?.Invoke(article);
                        break;
                    case "price":
                        var price = doc.RootElement.GetProperty("data")
                            .Deserialize<CoinPrice>();
                        if (price != null) OnPrice?.Invoke(price);
                        break;
                    case "whale":
                        var whale = doc.RootElement.GetProperty("data")
                            .Deserialize<WhaleAlert>();
                        if (whale != null) OnWhale?.Invoke(whale);
                        break;
                }
            }
            catch (Exception ex)
            {
                OnError?.Invoke(ex);
            }
        }
    }

    public async Task DisconnectAsync()
    {
        _cts?.Cancel();
        if (_ws?.State == WebSocketState.Open)
        {
            await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
        }
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _ws?.Dispose();
        _cts?.Dispose();
    }
}

// ═══════════════════════════════════════════════════════════════
// Examples
// ═══════════════════════════════════════════════════════════════

public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("═══════════════════════════════════════════════════════");
        Console.WriteLine("       Free Crypto News - C# Examples");
        Console.WriteLine("═══════════════════════════════════════════════════════\n");

        using var client = new CryptoNewsClient();

        // ─────────────────────────────────────────────────────────
        // News Examples
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("📰 Latest News:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var news = await client.GetNewsAsync(5);
        foreach (var article in news.Data)
        {
            Console.WriteLine($"  • {article.Title}");
            Console.WriteLine($"    {article.Source} | {article.TimeAgo}");
        }

        // ─────────────────────────────────────────────────────────
        // Search
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n🔍 Search 'ethereum ETF':");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var search = await client.SearchNewsAsync("ethereum ETF", 3);
        foreach (var article in search.Data)
        {
            Console.WriteLine($"  • {article.Title}");
        }

        // ─────────────────────────────────────────────────────────
        // Fear & Greed
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n😰 Fear & Greed Index:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var fearGreed = await client.GetFearGreedAsync();
        Console.WriteLine($"  Value: {fearGreed.Value}");
        Console.WriteLine($"  Classification: {fearGreed.Classification}");

        // ─────────────────────────────────────────────────────────
        // Sentiment
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n🎯 Bitcoin Sentiment:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var sentiment = await client.GetSentimentAsync("BTC");
        Console.WriteLine($"  Label: {sentiment.Label}");
        Console.WriteLine($"  Score: {sentiment.Score:F2}");
        Console.WriteLine($"  Confidence: {sentiment.Confidence:P0}");

        // ─────────────────────────────────────────────────────────
        // Trending
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n🔥 Trending Topics:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var trending = await client.GetTrendingAsync();
        foreach (var topic in trending.Take(5))
        {
            var emoji = topic.Sentiment switch
            {
                "bullish" => "🟢",
                "bearish" => "🔴",
                _ => "⚪"
            };
            Console.WriteLine($"  {emoji} {topic.Topic} ({topic.Count} mentions)");
        }

        // ─────────────────────────────────────────────────────────
        // Trading Signals
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n📊 Trading Signals:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var signals = await client.GetSignalsAsync(3);
        foreach (var signal in signals)
        {
            var emoji = signal.Action is "buy" or "long" ? "🟢" : "🔴";
            Console.WriteLine($"  {emoji} {signal.Action.ToUpper()} {signal.Symbol} @ ${signal.Price:N2}");
            Console.WriteLine($"    Confidence: {signal.Confidence:P0}");
        }

        // ─────────────────────────────────────────────────────────
        // Whale Alerts
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n🐋 Whale Alerts:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var whales = await client.GetWhaleAlertsAsync(5);
        foreach (var whale in whales)
        {
            var emoji = whale.Type switch
            {
                "exchange_inflow" => "📥",
                "exchange_outflow" => "📤",
                _ => "🔄"
            };
            Console.WriteLine($"  {emoji} {whale.Symbol}: ${whale.UsdValue:N0}");
            Console.WriteLine($"    {whale.FromLabel} → {whale.ToLabel}");
        }

        // ─────────────────────────────────────────────────────────
        // AI Question
        // ─────────────────────────────────────────────────────────
        Console.WriteLine("\n🤖 AI Question:");
        Console.WriteLine("─────────────────────────────────────────────────────────");
        
        var answer = await client.AskQuestionAsync("What is the latest Bitcoin news?");
        Console.WriteLine($"  {answer}");

        Console.WriteLine("\n═══════════════════════════════════════════════════════");
        Console.WriteLine("       Examples Complete!");
        Console.WriteLine("═══════════════════════════════════════════════════════");
    }
}
