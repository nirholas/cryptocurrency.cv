<?php

namespace CryptoNews\Tests\Endpoints;

use CryptoNews\Endpoints\News;
use CryptoNews\Models\Article;
use CryptoNews\Models\Response;
use CryptoNews\Tests\TestCase;

class NewsTest extends TestCase
{
    private News $news;

    protected function setUp(): void
    {
        $http = $this->mockHttp([
            'articles' => [
                [
                    'title' => 'Bitcoin hits $100k',
                    'link' => 'https://example.com/btc',
                    'source' => 'CoinDesk',
                    'timeAgo' => '2 hours ago',
                    'description' => 'Bitcoin surges past $100k',
                    'category' => 'bitcoin',
                    'sentiment' => 'bullish',
                    'publishedAt' => '2026-03-14T10:00:00Z',
                ],
                [
                    'title' => 'Ethereum 2.0 update',
                    'link' => 'https://example.com/eth',
                    'source' => 'CoinTelegraph',
                    'timeAgo' => '3 hours ago',
                ],
            ],
            'meta' => ['total' => 2],
        ]);
        $this->news = new News($http);
    }

    public function testLatestReturnsArticles(): void
    {
        $articles = $this->news->latest(10);
        $this->assertCount(2, $articles);
        $this->assertInstanceOf(Article::class, $articles[0]);
        $this->assertSame('Bitcoin hits $100k', $articles[0]->title);
        $this->assertSame('CoinDesk', $articles[0]->source);
    }

    public function testLatestWithMetaReturnsResponse(): void
    {
        $response = $this->news->latestWithMeta(10);
        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(2, $response->get('meta')['total']);
    }

    public function testSearchReturnsArticles(): void
    {
        $articles = $this->news->search('bitcoin', 5);
        $this->assertCount(2, $articles);
        $this->assertInstanceOf(Article::class, $articles[0]);
    }

    public function testBreakingReturnsArticles(): void
    {
        $articles = $this->news->breaking(5);
        $this->assertCount(2, $articles);
    }

    public function testBitcoinReturnsArticles(): void
    {
        $articles = $this->news->bitcoin(10);
        $this->assertCount(2, $articles);
    }

    public function testDefiNewsReturnsArticles(): void
    {
        $articles = $this->news->defiNews(10);
        $this->assertCount(2, $articles);
    }

    public function testTrendingReturnsResponse(): void
    {
        $response = $this->news->trending(10, 24);
        $this->assertInstanceOf(Response::class, $response);
    }

    public function testAnalyzeReturnsResponse(): void
    {
        $response = $this->news->analyze(20, 'bitcoin', 'bullish');
        $this->assertInstanceOf(Response::class, $response);
    }

    public function testArchiveReturnsResponse(): void
    {
        $response = $this->news->archive('2026-01-01', 'SEC', 50);
        $this->assertInstanceOf(Response::class, $response);
    }

    public function testOriginsReturnsResponse(): void
    {
        $response = $this->news->origins('binance', 'exchange', 10);
        $this->assertInstanceOf(Response::class, $response);
    }

    public function testSourcesReturnsArray(): void
    {
        $http = $this->mockHttp(['sources' => [['name' => 'CoinDesk'], ['name' => 'CoinTelegraph']]]);
        $news = new News($http);
        $sources = $news->sources();
        $this->assertCount(2, $sources);
        $this->assertSame('CoinDesk', $sources[0]['name']);
    }
}
