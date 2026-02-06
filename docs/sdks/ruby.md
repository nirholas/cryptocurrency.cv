# Ruby SDK

The Ruby SDK provides a thread-safe, production-ready client for the Free Crypto News API.

## Features

- ✅ **Zero dependencies** - Uses Ruby stdlib only
- ✅ **Thread-safe** - Safe for concurrent use
- ✅ **Async support** - Non-blocking operations
- ✅ **Automatic retries** - Exponential backoff
- ✅ **Rate limit handling** - Smart retry logic
- ✅ **Gzip compression** - Efficient transfers
- ✅ **Portfolio tools** - Tax reporting included
- ✅ **Batch operations** - Parallel requests

## Installation

### From RubyGems

```bash
gem install fcn-sdk
```

### In Gemfile

```ruby
gem 'fcn-sdk', '~> 0.2'
```

### From Source

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/sdk/ruby
gem build fcn-sdk.gemspec
gem install fcn-sdk-*.gem
```

## Quick Start

```ruby
require 'fcn'

# Create client (no API key needed!)
client = FCN::Client.new

# Get latest news
news = client.get_news(limit: 10)
news['articles'].each do |article|
  puts "📰 #{article['title']} - #{article['source']}"
end
```

## Configuration

### Global Configuration

```ruby
FCN.configure do |config|
  config.api_key = 'your_api_key'  # Optional for premium features
  config.timeout = 60
  config.max_retries = 3
  config.base_url = 'https://cryptocurrency.cv'
end

client = FCN::Client.new
```

### Per-Client Configuration

```ruby
client = FCN::Client.new(
  api_key: 'your_api_key',
  timeout: 60,
  max_retries: 5
)
```

## News API

```ruby
# Get latest news
news = client.get_news(limit: 20)

# Filter by ticker
btc_news = client.get_news(limit: 10, ticker: 'BTC')

# Get news by ticker
eth_news = client.get_news_by_ticker('ETH', limit: 10)

# Get breaking news
breaking = client.get_breaking_news(limit: 5)

# Get trending topics
trending = client.get_trending(limit: 10)

# Search articles
results = client.search('ethereum upgrade', limit: 10)
```

## AI & Analytics

```ruby
# Sentiment analysis
sentiment = client.get_sentiment(limit: 20)
puts "Market sentiment: #{sentiment['overall']} (#{sentiment['score']})"

# AI-powered digest
digest = client.get_digest
puts "📊 Today's summary:\n#{digest['summary']}"

# Ask questions about crypto news
answer = client.ask("What's happening with Bitcoin?")
puts "🤖 #{answer['response']}"

# Entity extraction
entities = client.get_entities(limit: 30, type: 'company')

# Price predictions
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
puts "24h change: #{performance['change_24h']}%"

# Generate tax report
tax = client.get_tax_report(
  portfolio_id: 'demo',
  year: 2025,
  method: 'FIFO'
)
puts "Total gains: $#{tax['total_gains']}"
puts "Taxable events: #{tax['events'].count}"

# Add transaction
client.add_transaction(
  type: 'buy',
  asset: 'BTC',
  amount: 0.5,
  price: 95000,
  timestamp: Time.now.iso8601
)
```

## On-chain Events

```ruby
# Get on-chain events correlated to news
events = client.get_onchain_events(chain: 'ethereum')
events.each do |event|
  puts "🔗 #{event['event_type']} - #{event['description']}"
end
```

## Batch Operations

Execute multiple requests in parallel:

```ruby
results = client.batch([
  { method: :get_news, args: { limit: 10 } },
  { method: :get_trending },
  { method: :get_sentiment, args: { limit: 5 } }
])

news = results[0]
trending = results[1]
sentiment = results[2]
```

## Async Operations

```ruby
# Use async client for non-blocking operations
client = FCN::AsyncClient.new

# Execute asynchronously
thread = client.async.get_news(limit: 10)

# Do other work while waiting...

# Get result when ready
news = thread.value
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
rescue FCN::NotFoundError
  puts "Resource not found"
rescue FCN::APIError => e
  puts "API error: #{e.message} (#{e.status})"
rescue FCN::NetworkError => e
  puts "Network error: #{e.message}"
end
```

## API Reference

### Client Methods

| Method | Description |
|--------|-------------|
| `get_news(limit:, ticker:)` | Fetch latest news articles |
| `get_news_by_ticker(ticker, limit:)` | Get news for specific ticker |
| `get_breaking_news(limit:)` | Get breaking news (< 2h old) |
| `get_trending(limit:)` | Get trending tickers |
| `search(query, limit:)` | Search articles by keyword |
| `get_sentiment(limit:)` | Get sentiment analysis |
| `get_digest` | Get AI-generated daily digest |
| `ask(question)` | Natural language Q&A |
| `get_entities(limit:, type:)` | Extract named entities |
| `get_predictions(asset:)` | Get price predictions |
| `get_onchain_events(chain:)` | Get correlated on-chain events |
| `get_portfolio_performance(portfolio_id:, period:)` | Portfolio metrics |
| `get_tax_report(portfolio_id:, year:, method:)` | Generate tax report |
| `add_transaction(type:, asset:, amount:, price:)` | Add portfolio transaction |
| `batch(requests)` | Execute parallel requests |

### Error Classes

| Error | Description |
|-------|-------------|
| `FCN::APIError` | Base API error class |
| `FCN::RateLimitError` | Rate limit exceeded |
| `FCN::AuthenticationError` | Invalid API key |
| `FCN::NotFoundError` | Resource not found |
| `FCN::NetworkError` | Connection error |

## Examples

### Rails Integration

```ruby
# app/services/crypto_news_service.rb
class CryptoNewsService
  def initialize
    @client = FCN::Client.new
  end

  def latest_headlines(limit = 10)
    news = @client.get_news(limit: limit)
    news['articles'].map do |article|
      {
        title: article['title'],
        source: article['source'],
        url: article['link'],
        published: Time.parse(article['pubDate'])
      }
    end
  end

  def market_sentiment
    @client.get_sentiment(limit: 20)
  end
end

# In controller
class NewsController < ApplicationController
  def index
    @headlines = CryptoNewsService.new.latest_headlines(20)
  end
end
```

### Background Job

```ruby
# app/jobs/crypto_digest_job.rb
class CryptoDigestJob < ApplicationJob
  queue_as :default

  def perform
    client = FCN::Client.new
    digest = client.get_digest

    User.subscribed.find_each do |user|
      CryptoDigestMailer.daily(user, digest).deliver_later
    end
  end
end
```

### Sinatra App

```ruby
require 'sinatra'
require 'fcn'

client = FCN::Client.new

get '/news' do
  content_type :json
  client.get_news(limit: params[:limit] || 10).to_json
end

get '/search' do
  content_type :json
  client.search(params[:q], limit: 10).to_json
end
```

## License

MIT
