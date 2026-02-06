# frozen_string_literal: true

require 'net/http'
require 'json'
require 'uri'
require 'openssl'

# Free Crypto News Ruby SDK
# 
# Production-ready Ruby client for the Free Crypto News API.
# 
# @example Basic usage
#   client = FCN::Client.new
#   news = client.get_news(limit: 10)
#   news['articles'].each { |a| puts a['title'] }
#
# @example With API key
#   client = FCN::Client.new(api_key: 'your_key')
#   digest = client.get_digest
#   puts digest['summary']
#
module FCN
  VERSION = '0.2.0'
  BASE_URL = 'https://cryptocurrency.cv/api'
  WS_URL = 'wss://cryptocurrency.cv/ws'

  # Custom error class for API errors
  class APIError < StandardError
    attr_reader :status, :response, :retry_after

    def initialize(message, status = nil, response = nil, retry_after = nil)
      super(message)
      @status = status
      @response = response
      @retry_after = retry_after
    end
  end

  # Rate limit exceeded error
  class RateLimitError < APIError
    def initialize(retry_after = 60)
      super("Rate limit exceeded. Retry after #{retry_after} seconds.", 429, nil, retry_after)
    end
  end

  # Authentication error
  class AuthenticationError < APIError
    def initialize
      super('Unauthorized - invalid API key', 401)
    end
  end

  # Configuration class
  class Configuration
    attr_accessor :api_key, :base_url, :timeout, :max_retries, :retry_delay

    def initialize
      @api_key = nil
      @base_url = BASE_URL
      @timeout = 30
      @max_retries = 3
      @retry_delay = 1.0
    end
  end

  class << self
    attr_accessor :configuration

    def configure
      self.configuration ||= Configuration.new
      yield(configuration)
    end

    def reset_configuration!
      self.configuration = Configuration.new
    end
  end

  # Main API client class
  class Client
    attr_reader :base_url, :api_key, :config

    # Create a new FCN client
    #
    # @param api_key [String, nil] Optional API key for authenticated requests
    # @param base_url [String] Base URL for the API
    # @param timeout [Integer] Request timeout in seconds
    # @param max_retries [Integer] Maximum retry attempts
    def initialize(api_key: nil, base_url: nil, timeout: nil, max_retries: nil)
      @config = FCN.configuration || Configuration.new
      @api_key = api_key || @config.api_key
      @base_url = base_url || @config.base_url
      @timeout = timeout || @config.timeout
      @max_retries = max_retries || @config.max_retries
      @rate_limit_remaining = nil
      @rate_limit_reset = nil
    end

    # Get current rate limit status
    # @return [Hash] Rate limit info
    def rate_limit_status
      {
        remaining: @rate_limit_remaining,
        reset_at: @rate_limit_reset
      }
    end

    # ==========================================================================
    # NEWS API
    # ==========================================================================

    # Get latest news articles
    #
    # @param limit [Integer] Number of articles to return (max 100)
    # @param source [String, nil] Filter by source
    # @param category [String, nil] Filter by category
    # @param ticker [String, nil] Filter by ticker symbol
    # @param q [String, nil] Search query
    # @param since [String, nil] ISO date to filter articles after
    # @param cursor [String, nil] Pagination cursor
    # @return [Hash] News response with articles array
    def get_news(limit: 50, source: nil, category: nil, ticker: nil, q: nil, since: nil, cursor: nil)
      params = { limit: limit }
      params[:source] = source if source
      params[:category] = category if category
      params[:ticker] = ticker if ticker
      params[:q] = q if q
      params[:since] = since if since
      params[:cursor] = cursor if cursor

      get('/news', params)
    end

    # Get news by category
    # @param category [String] Category name
    # @param limit [Integer] Number of results
    # @return [Hash] News response
    def get_news_by_category(category, limit: 20)
      get_news(category: category, limit: limit)
    end

    # Get news by ticker
    # @param ticker [String] Ticker symbol (e.g., 'BTC', 'ETH')
    # @param limit [Integer] Number of results
    # @return [Hash] News response
    def get_news_by_ticker(ticker, limit: 20)
      get_news(ticker: ticker.upcase, limit: limit)
    end

    # Get trending tickers
    #
    # @param limit [Integer] Number of trending items
    # @return [Hash] Trending response
    def get_trending(limit: 20)
      get('/trending', limit: limit)
    end

    # Search news articles
    #
    # @param query [String] Search query
    # @param limit [Integer] Number of results
    # @return [Hash] Search results
    def search(query, limit: 20)
      get('/search', q: query, limit: limit)
    end

    # Get available news sources
    # @return [Hash] List of sources
    def get_sources
      get('/sources')
    end

    # ==========================================================================
    # AI & ANALYTICS API
    # ==========================================================================

    # Get sentiment analysis
    #
    # @param limit [Integer] Number of articles to analyze
    # @return [Hash] Sentiment results
    def get_sentiment(limit: 20)
      get('/sentiment', limit: limit)
    end

    # Get AI-generated daily digest
    #
    # @return [Hash] Digest with summary and top stories
    def get_digest
      get('/digest')
    end

    # Ask a question about crypto news
    #
    # @param question [String] Natural language question
    # @return [Hash] AI response
    def ask(question)
      get('/ask', q: question)
    end

    # Get entity extraction from news
    #
    # @param limit [Integer] Number of articles to analyze
    # @param type [String, nil] Filter by entity type (person, company, protocol, etc.)
    # @return [Hash] Extracted entities
    def get_entities(limit: 30, type: nil)
      params = { limit: limit }
      params[:type] = type if type
      get('/entities', params)
    end

    # Get relationship extraction from news
    #
    # @param limit [Integer] Number of articles to analyze
    # @param actor_type [String, nil] Filter by actor type
    # @param sentiment [String, nil] Filter by sentiment
    # @return [Hash] Extracted relationships
    def get_relationships(limit: 20, actor_type: nil, sentiment: nil)
      params = { limit: limit }
      params[:actor_type] = actor_type if actor_type
      params[:sentiment] = sentiment if sentiment
      get('/relationships', params)
    end

    # Get predictions extracted from news
    #
    # @param asset [String, nil] Filter by asset
    # @param type [String, nil] Filter by prediction type
    # @return [Hash] Predictions
    def get_predictions(asset: nil, type: nil)
      params = {}
      params[:asset] = asset if asset
      params[:type] = type if type
      get('/predictions', params)
    end

    # ==========================================================================
    # MARKET DATA API
    # ==========================================================================

    # Get market data for coins
    #
    # @param limit [Integer] Number of coins
    # @return [Hash] Market data
    def get_market(limit: 100)
      get('/market/coins', limit: limit)
    end

    # Get market trending coins
    #
    # @return [Hash] Trending coins
    def get_market_trending
      get('/market/trending')
    end

    # Get coin details
    #
    # @param coin_id [String] CoinGecko coin ID
    # @return [Hash] Coin details
    def get_coin(coin_id)
      get("/market/coins/#{coin_id}")
    end

    # Get Fear & Greed Index
    # @return [Hash] Fear & Greed data
    def get_fear_greed
      get('/market/fear-greed')
    end

    # ==========================================================================
    # ON-CHAIN API
    # ==========================================================================

    # Get on-chain events linked to news
    #
    # @param chain [String, nil] Filter by blockchain (ethereum, bitcoin, solana, etc.)
    # @param type [String, nil] Filter by event type
    # @return [Hash] On-chain event links
    def get_onchain_events(chain: nil, type: nil)
      params = {}
      params[:chain] = chain if chain
      params[:type] = type if type
      get('/onchain/events', params)
    end

    # ==========================================================================
    # PORTFOLIO API
    # ==========================================================================

    # Get portfolio performance
    #
    # @param portfolio_id [String] Portfolio ID
    # @param period [String] Time period (7d, 30d, 90d, 1y, all)
    # @return [Hash] Performance data with charts
    def get_portfolio_performance(portfolio_id: 'demo', period: '30d')
      get('/portfolio/performance', portfolio_id: portfolio_id, period: period)
    end

    # Generate tax report
    #
    # @param portfolio_id [String] Portfolio ID
    # @param year [Integer] Tax year
    # @param method [String] Cost basis method (FIFO, LIFO, HIFO)
    # @param jurisdiction [String] Tax jurisdiction (US, UK, etc.)
    # @param format [String] Output format (json, csv, form8949)
    # @return [Hash] Tax report with Form 8949 data
    def get_tax_report(portfolio_id: 'demo', year: Time.now.year, method: 'FIFO', jurisdiction: 'US', format: 'json')
      get('/portfolio/tax', 
        portfolio_id: portfolio_id, 
        year: year, 
        method: method,
        jurisdiction: jurisdiction,
        format: format
      )
    end

    # Add transaction for tax tracking
    #
    # @param portfolio_id [String] Portfolio ID
    # @param type [String] Transaction type (buy, sell, swap, stake, etc.)
    # @param asset [String] Asset symbol
    # @param amount [Float] Amount
    # @param price [Float] Price per unit
    # @param timestamp [String] ISO timestamp
    # @param options [Hash] Additional options (fee, fee_asset, tx_hash, notes)
    # @return [Hash] Created transaction
    def add_transaction(portfolio_id: 'demo', type:, asset:, amount:, price:, timestamp:, **options)
      body = {
        portfolio_id: portfolio_id,
        type: type,
        asset: asset.upcase,
        amount: amount,
        price: price,
        timestamp: timestamp,
        **options
      }
      post('/portfolio/tax', body)
    end

    # ==========================================================================
    # SOCIAL INTELLIGENCE API
    # ==========================================================================

    # Get Discord channel intelligence
    #
    # @param channel_id [String, nil] Discord channel ID
    # @param guild_id [String, nil] Discord guild ID
    # @param keyword [String, nil] Filter by keyword
    # @return [Hash] Discord intelligence
    def get_discord_intel(channel_id: nil, guild_id: nil, keyword: nil)
      params = {}
      params[:channel_id] = channel_id if channel_id
      params[:guild_id] = guild_id if guild_id
      params[:keyword] = keyword if keyword
      get('/social/discord', params)
    end

    # Get influencer credibility scores
    #
    # @param limit [Integer] Number of articles to analyze
    # @param min_credibility [Integer] Minimum credibility score (0-100)
    # @return [Hash] Influencer analysis
    def get_influencers(limit: 30, min_credibility: 0)
      get('/analytics/influencers', limit: limit, min_credibility: min_credibility)
    end

    # Get social metrics
    #
    # @param ticker [String, nil] Ticker symbol
    # @return [Hash] Social metrics
    def get_social_metrics(ticker: nil)
      params = {}
      params[:ticker] = ticker if ticker
      get('/social/metrics', params)
    end

    # ==========================================================================
    # ANALYTICS API
    # ==========================================================================

    # Get API usage analytics
    #
    # @param days [Integer] Number of days to analyze
    # @return [Hash] Usage analytics
    def get_usage_analytics(days: 30)
      get('/analytics/usage', days: days)
    end

    # Get coverage gap analysis
    #
    # @return [Hash] Coverage gaps
    def get_coverage_gaps
      get('/analytics/coverage-gaps')
    end

    # ==========================================================================
    # ALERTS API
    # ==========================================================================

    # Create a price alert
    #
    # @param coin [String] Coin symbol
    # @param condition [String] Condition (above, below, percent_up, percent_down)
    # @param threshold [Float] Threshold value
    # @param options [Hash] Additional options
    # @return [Hash] Created alert
    def create_price_alert(coin:, condition:, threshold:, **options)
      body = {
        coin: coin.upcase,
        condition: condition,
        threshold: threshold,
        **options
      }
      post('/alerts', body)
    end

    # Create a keyword alert
    #
    # @param keywords [Array<String>] Keywords to monitor
    # @param sources [Array<String>, nil] Sources to filter
    # @return [Hash] Created alert
    def create_keyword_alert(keywords:, sources: nil)
      body = {
        type: 'keyword',
        keywords: Array(keywords),
        sources: sources
      }
      post('/alerts', body)
    end

    # Get user alerts
    #
    # @return [Hash] User's alerts
    def get_alerts
      get('/alerts')
    end

    # Delete an alert
    #
    # @param alert_id [String] Alert ID
    # @return [Hash] Deletion result
    def delete_alert(alert_id)
      delete("/alerts/#{alert_id}")
    end

    # ==========================================================================
    # UTILITIES
    # ==========================================================================

    # Check API health
    #
    # @return [Boolean] True if API is healthy
    def healthy?
      response = get('/health')
      response['status'] == 'ok' || response['healthy'] == true
    rescue StandardError
      false
    end

    # Get API statistics
    #
    # @return [Hash] API stats
    def get_stats
      get('/stats')
    end

    # Get API version
    #
    # @return [String] API version
    def api_version
      response = get('/health')
      response['version']
    rescue StandardError
      'unknown'
    end

    # ==========================================================================
    # BATCH OPERATIONS
    # ==========================================================================

    # Execute multiple requests in parallel (using threads)
    #
    # @param requests [Array<Hash>] Array of request configs
    # @return [Array<Hash>] Array of responses
    # @example
    #   results = client.batch([
    #     { method: :get_news, args: { limit: 10 } },
    #     { method: :get_trending },
    #     { method: :get_sentiment, args: { limit: 5 } }
    #   ])
    def batch(requests)
      threads = requests.map do |req|
        Thread.new do
          method = req[:method]
          args = req[:args] || {}
          begin
            { success: true, data: send(method, **args) }
          rescue StandardError => e
            { success: false, error: e.message }
          end
        end
      end
      threads.map(&:value)
    end

    private

    def get(path, params = {})
      uri = build_uri(path, params)
      request = Net::HTTP::Get.new(uri)
      add_headers(request)
      execute_with_retry(uri, request)
    end

    def post(path, body = {})
      uri = build_uri(path)
      request = Net::HTTP::Post.new(uri)
      add_headers(request)
      request.body = body.to_json
      execute_with_retry(uri, request)
    end

    def delete(path)
      uri = build_uri(path)
      request = Net::HTTP::Delete.new(uri)
      add_headers(request)
      execute_with_retry(uri, request)
    end

    def build_uri(path, params = {})
      uri = URI.parse("#{base_url}#{path}")
      uri.query = URI.encode_www_form(params) unless params.empty?
      uri
    end

    def add_headers(request)
      request['Content-Type'] = 'application/json'
      request['Accept'] = 'application/json'
      request['Accept-Encoding'] = 'gzip'
      request['User-Agent'] = "FCN-Ruby-SDK/#{VERSION}"
      request['Authorization'] = "Bearer #{api_key}" if api_key
    end

    def execute_with_retry(uri, request)
      retries = 0
      begin
        execute(uri, request)
      rescue RateLimitError => e
        if retries < @max_retries
          retries += 1
          sleep(e.retry_after || @config.retry_delay)
          retry
        end
        raise
      rescue StandardError => e
        if retries < @max_retries && retryable_error?(e)
          retries += 1
          sleep(@config.retry_delay * (2 ** retries))
          retry
        end
        raise
      end
    end

    def retryable_error?(error)
      error.is_a?(Net::OpenTimeout) || 
      error.is_a?(Net::ReadTimeout) || 
      error.is_a?(Errno::ECONNRESET) ||
      error.is_a?(Errno::ECONNREFUSED)
    end

    def execute(uri, request)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 10
      http.read_timeout = @timeout
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER

      response = http.request(request)

      # Update rate limit info
      @rate_limit_remaining = response['x-ratelimit-remaining']&.to_i
      @rate_limit_reset = response['x-ratelimit-reset']&.to_i

      case response
      when Net::HTTPSuccess
        parse_response(response)
      when Net::HTTPTooManyRequests
        retry_after = response['retry-after']&.to_i || 60
        raise RateLimitError.new(retry_after)
      when Net::HTTPUnauthorized
        raise AuthenticationError.new
      when Net::HTTPServiceUnavailable
        raise APIError.new('Service unavailable', 503, response.body)
      else
        raise APIError.new("API error: #{response.message}", response.code.to_i, response.body)
      end
    end

    def parse_response(response)
      body = response.body
      
      # Handle gzip
      if response['content-encoding'] == 'gzip'
        require 'zlib'
        body = Zlib::GzipReader.new(StringIO.new(body)).read
      end
      
      JSON.parse(body)
    rescue JSON::ParserError => e
      raise APIError.new("Failed to parse response: #{e.message}", nil, body)
    end
  end

  # Async client wrapper (using Threads)
  class AsyncClient < Client
    # Execute request asynchronously
    #
    # @return [Thread] Thread with result
    def async
      AsyncWrapper.new(self)
    end
  end

  # Wrapper for async method calls
  class AsyncWrapper
    def initialize(client)
      @client = client
    end

    def method_missing(method, *args, **kwargs, &block)
      Thread.new { @client.send(method, *args, **kwargs, &block) }
    end

    def respond_to_missing?(method, include_private = false)
      @client.respond_to?(method, include_private)
    end
  end
end
