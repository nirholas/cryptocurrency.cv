<?php

namespace CryptoNews;

use CryptoNews\Cache\CacheInterface;
use CryptoNews\Endpoints\DeFi;
use CryptoNews\Endpoints\Market;
use CryptoNews\Endpoints\News;
use CryptoNews\Endpoints\OnChain;
use CryptoNews\Http\HttpClient;

class Client
{
    private string $baseUrl;
    private HttpClient $http;

    public News $news;
    public Market $market;
    public DeFi $defi;
    public OnChain $onchain;

    /**
     * @param string $baseUrl API base URL
     * @param int $timeout Request timeout in seconds
     * @param CacheInterface|null $cache Optional cache implementation
     * @param int $cacheTtl Default cache TTL in seconds (0 to disable)
     */
    public function __construct(
        string $baseUrl = 'https://cryptocurrency.cv',
        int $timeout = 30,
        ?CacheInterface $cache = null,
        int $cacheTtl = 60
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->http = new HttpClient($this->baseUrl, $timeout, 2, $cache, $cacheTtl);
        $this->news = new News($this->http);
        $this->market = new Market($this->http);
        $this->defi = new DeFi($this->http);
        $this->onchain = new OnChain($this->http);
    }

    /**
     * Check API health status.
     *
     * @return array<string, mixed>
     */
    public function health(): array
    {
        return $this->http->get('/api/health');
    }

    /**
     * Get API statistics.
     *
     * @return array<string, mixed>
     */
    public function stats(): array
    {
        return $this->http->get('/api/stats');
    }

    /**
     * Get RSS feed URL.
     */
    public function rssUrl(string $feed = 'all'): string
    {
        if ($feed === 'all') {
            return $this->baseUrl . '/api/rss';
        }
        return $this->baseUrl . '/api/rss?feed=' . urlencode($feed);
    }

    /**
     * Get Atom feed URL.
     */
    public function atomUrl(string $feed = 'all'): string
    {
        if ($feed === 'all') {
            return $this->baseUrl . '/api/atom';
        }
        return $this->baseUrl . '/api/atom?feed=' . urlencode($feed);
    }

    /**
     * Get rate limit info from the most recent API response.
     *
     * @return array{remaining: int|null, limit: int|null, reset: int|null}
     */
    public function rateLimitInfo(): array
    {
        return $this->http->getRateLimitInfo();
    }
}
