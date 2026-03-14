<?php

namespace CryptoNews\Tests\Models;

use CryptoNews\Models\Article;
use CryptoNews\Models\Price;
use CryptoNews\Models\Response;
use PHPUnit\Framework\TestCase;

class ModelsTest extends TestCase
{
    public function testArticleFromArray(): void
    {
        $article = new Article([
            'title' => 'Test Article',
            'link' => 'https://example.com',
            'source' => 'TestSource',
            'timeAgo' => '1 hour ago',
            'description' => 'A description',
            'category' => 'bitcoin',
            'sentiment' => 'bullish',
            'publishedAt' => '2026-03-14T12:00:00Z',
        ]);

        $this->assertSame('Test Article', $article->title);
        $this->assertSame('https://example.com', $article->link);
        $this->assertSame('TestSource', $article->source);
        $this->assertSame('1 hour ago', $article->timeAgo);
        $this->assertSame('A description', $article->description);
        $this->assertSame('bitcoin', $article->category);
        $this->assertSame('bullish', $article->sentiment);
    }

    public function testArticleHandlesMissingFields(): void
    {
        $article = new Article(['title' => 'Minimal']);
        $this->assertSame('Minimal', $article->title);
        $this->assertSame('', $article->link);
        $this->assertNull($article->description);
        $this->assertNull($article->sentiment);
    }

    public function testArticleToArray(): void
    {
        $data = [
            'title' => 'Test',
            'link' => 'https://example.com',
            'source' => 'Src',
            'timeAgo' => '5m',
        ];
        $article = new Article($data);
        $arr = $article->toArray();
        $this->assertSame('Test', $arr['title']);
        $this->assertSame('https://example.com', $arr['link']);
        $this->assertNull($arr['category']);
    }

    public function testArticleJsonSerialize(): void
    {
        $article = new Article(['title' => 'JSON Test', 'link' => 'https://x.com', 'source' => 'X', 'timeAgo' => '1m']);
        $json = json_encode($article);
        $decoded = json_decode($json, true);
        $this->assertSame('JSON Test', $decoded['title']);
    }

    public function testPriceFromArray(): void
    {
        $price = new Price([
            'symbol' => 'BTC',
            'price' => 99999.99,
            'change24h' => 5.2,
            'marketCap' => 2000000000000,
            'volume24h' => 50000000000,
        ]);

        $this->assertSame('BTC', $price->symbol);
        $this->assertSame(99999.99, $price->price);
        $this->assertSame(5.2, $price->change24h);
    }

    public function testPriceHandlesMissing(): void
    {
        $price = new Price(['symbol' => 'ETH', 'price' => 5000]);
        $this->assertSame('ETH', $price->symbol);
        $this->assertSame(5000.0, $price->price);
        $this->assertNull($price->change24h);
        $this->assertNull($price->marketCap);
    }

    public function testPriceJsonSerialize(): void
    {
        $price = new Price(['symbol' => 'SOL', 'price' => 250]);
        $json = json_encode($price);
        $decoded = json_decode($json, true);
        $this->assertSame('SOL', $decoded['symbol']);
        $this->assertSame(250.0, $decoded['price']);
    }

    public function testResponseGet(): void
    {
        $response = new Response(['status' => 'ok', 'count' => 42]);
        $this->assertSame('ok', $response->get('status'));
        $this->assertSame(42, $response->get('count'));
        $this->assertNull($response->get('missing'));
        $this->assertSame('default', $response->get('missing', 'default'));
    }

    public function testResponseGetArticles(): void
    {
        $response = new Response([
            'articles' => [
                ['title' => 'A1', 'link' => 'https://a1.com', 'source' => 'S1', 'timeAgo' => '1m'],
                ['title' => 'A2', 'link' => 'https://a2.com', 'source' => 'S2', 'timeAgo' => '2m'],
            ],
        ]);
        $articles = $response->getArticles();
        $this->assertCount(2, $articles);
        $this->assertInstanceOf(Article::class, $articles[0]);
        $this->assertSame('A1', $articles[0]->title);
    }

    public function testResponseToArray(): void
    {
        $data = ['a' => 1, 'b' => 2];
        $response = new Response($data);
        $this->assertSame($data, $response->toArray());
    }

    public function testResponseJsonSerialize(): void
    {
        $response = new Response(['key' => 'value']);
        $json = json_encode($response);
        $decoded = json_decode($json, true);
        $this->assertSame('value', $decoded['key']);
    }
}
