# Free Crypto News Ruby SDK

Production-ready Ruby client for the [Free Crypto News API](https://cryptocurrency.cv).

## Features

- ✅ **Zero dependencies** (uses stdlib only)
- ✅ **Thread-safe** with async support
- ✅ **Automatic retries** with exponential backoff
- ✅ **Rate limit handling** with smart retry
- ✅ **Gzip compression** for efficient transfers
- ✅ **Portfolio tools** with tax reporting
- ✅ **On-chain events** correlation
- ✅ **Batch operations** for parallel requests
- ✅ **Global configuration** support

## Installation

Add to your Gemfile:

```ruby
gem 'fcn-sdk', '~> 0.2'
```

Or install directly:

```bash
gem install fcn-sdk
```

## Quick Start

```ruby
require 'fcn'

# Create client
client = FCN::Client.new

# Get latest news
news = client.get_news(limit: 10)
news['articles'].each do |article|
  puts "📰 #{article['title']}"
end
```

### With Configuration

```ruby
# Global configuration
FCN.configure do |config|
  config.api_key = 'your_api_key'
  config.timeout = 60
  config.max_retries = 3
end

client = FCN::Client.new

# Or per-client configuration
client = FCN::Client.new(
  api_key: 'your_api_key',
  timeout: 60
)
```

## News API

```ruby
# Get latest news with filters
news = client.get_news(limit: 20, ticker: 'BTC')

# Get by ticker
btc_news = client.get_news_by_ticker('BTC', limit: 10)

# Get trending tickers
trending = client.get_trending(limit: 10)

# Search articles
results = client.search('ethereum upgrade', limit: 10)
```

## AI & Analytics

```ruby
# Sentiment analysis
sentiment = client.get_sentiment(limit: 20)
puts "Market sentiment: #{sentiment['overall']}"

# AI digest
digest = client.get_digest
puts "📊 Today's summary:\n#{digest['summary']}"

# Ask anything
answer = client.ask("What's happening with Bitcoin?")
puts "🤖 #{answer['response']}"

# Entity extraction
entities = client.get_entities(limit: 30, type: 'company')

# Predictions
predictions = client.get_predictions(asset: 'BTC')
```

## Portfolio Tools

```ruby
# Get portfolio performance
performance = client.get_portfolio_performance(
  portfolio_id: 'demo',
  period: '30d'
)
puts "Portfolio value: $#{performance['current_value']}"

# Generate tax report
tax = client.get_tax_report(
  portfolio_id: 'demo',
  year: 2024,
  method: 'FIFO'
)
puts "Total gains: $#{tax['total_gains']}"

# Add transaction
client.add_transaction(
  type: 'buy',
  asset: 'BTC',
  amount: 0.5,
  price: 45000,
  timestamp: Time.now.iso8601
)
```

## On-chain Events

```ruby
# Get on-chain events correlated to news
events = client.get_onchain_events(chain: 'ethereum')
```

## Batch Operations

```ruby
# Execute multiple requests in parallel
results = client.batch([
  { method: :get_news, args: { limit: 10 } },
  { method: :get_trending },
  { method: :get_sentiment, args: { limit: 5 } }
])
```

## Async Operations

```ruby
# Use async client
client = FCN::AsyncClient.new

# Execute asynchronously
thread = client.async.get_news(limit: 10)
# Do other work...
news = thread.value  # Get result when ready
```

## Error Handling

```ruby
begin
  news = client.get_news
rescue FCN::RateLimitError => e
  puts "Rate limited, retry after #{e.retry_after}s"
  sleep e.retry_after
  retry
rescue FCN::AuthenticationError
  puts "Invalid API key"
rescue FCN::APIError => e
  puts "API error: #{e.message}"
end
```

## API Reference

| Method | Description |
|--------|-------------|
| `get_news` | Fetch latest news |
| `get_trending` | Get trending tickers |
| `search` | Search articles |
| `get_sentiment` | Sentiment analysis |
| `get_digest` | AI-generated digest |
| `ask` | Natural language Q&A |
| `get_entities` | Entity extraction |
| `get_predictions` | Price predictions |
| `get_onchain_events` | On-chain events |
| `get_portfolio_performance` | Portfolio metrics |
| `get_tax_report` | Tax report |
| `batch` | Parallel requests |

## License

MIT

### Trending

```ruby
trending = client.get_trending(limit: 20)
trending['trending'].each do |item|
  puts "$#{item['symbol']}: #{item['mentions']} mentions"
end
```

### Market Data

```ruby
# Get top coins by market cap
market = client.get_market(limit: 100)
market['coins'].each do |coin|
  puts "#{coin['symbol']}: $#{coin['current_price']}"
end

# Get specific coin
btc = client.get_coin('bitcoin')
```

### AI Features

```ruby
# Sentiment analysis
sentiments = client.get_sentiment(limit: 10)

# AI-generated digest
digest = client.get_digest
puts "Market mood: #{digest['market_mood']}"
puts digest['summary']

# Ask questions
answer = client.ask("What's happening with Ethereum?")
puts answer['answer']

# Entity extraction
entities = client.get_entities(limit: 30, type: 'person')

# Relationship extraction
relationships = client.get_relationships(limit: 20)
relationships['relationships'].each do |rel|
  puts "#{rel['subject']['name']} #{rel['action']} #{rel['object']}"
end
```

### Predictions

```ruby
predictions = client.get_predictions(asset: 'BTC')
predictions['predictions'].each do |pred|
  puts "#{pred['source']['name']}: #{pred['prediction']}"
end
```

### On-Chain Events

```ruby
events = client.get_onchain_events(chain: 'ethereum', type: 'transfer')
events['links'].each do |link|
  puts link['articleTitle']
  link['events'].each { |e| puts "  - #{e['description']}" }
end
```

### Portfolio Tools

```ruby
# Portfolio performance
performance = client.get_portfolio_performance(period: '30d')
puts "Total P&L: $#{performance['summary']['totalPnl']}"
puts "Sharpe Ratio: #{performance['riskMetrics']['sharpeRatio']}"

# Tax report
tax = client.get_tax_report(year: 2025, method: 'FIFO')
puts "Total gains: $#{tax['summary']['capitalGains']['total']['net']}"
```

### Social Intelligence

```ruby
# Discord monitoring (requires DISCORD_BOT_TOKEN)
discord = client.get_discord_intel(channel_id: '123456789')
discord['trending']['tickers'].each do |t|
  puts "$#{t['ticker']}: #{t['mentions']} mentions (#{t['sentiment']})"
end

# Influencer analysis
influencers = client.get_influencers(min_credibility: 70)
influencers['influencers'].each do |inf|
  puts "#{inf['name']} - Credibility: #{inf['credibilityScore']}"
end
```

### API Usage Analytics

```ruby
usage = client.get_usage_analytics(days: 30)
puts "Total requests: #{usage['summary']['totalRequests']}"
usage['insights'].each { |insight| puts insight }
```

## Authentication

For higher rate limits:

```ruby
client = FCN::Client.new(api_key: 'your_api_key')
```

Get your free API key at: https://cryptocurrency.cv/dashboard

## Error Handling

```ruby
begin
  news = client.get_news
rescue FCN::APIError => e
  case e.status
  when 429
    puts "Rate limited! Wait and retry."
  when 401
    puts "Invalid API key"
  when 503
    puts "AI features not configured"
  else
    puts "API error: #{e.message}"
  end
end
```

## Custom Base URL

For self-hosted instances:

```ruby
client = FCN::Client.new(base_url: 'https://your-instance.com/api')
```

## Thread Safety

The client is thread-safe. You can share a single client instance across threads.

## License

MIT License - see [LICENSE](../../LICENSE) for details.
