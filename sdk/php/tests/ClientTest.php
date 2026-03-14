<?php

namespace CryptoNews\Tests;

use CryptoNews\Client;

class ClientTest extends TestCase
{
    public function testConstructorSetsDefaults(): void
    {
        $client = new Client();
        $this->assertInstanceOf(\CryptoNews\Endpoints\News::class, $client->news);
        $this->assertInstanceOf(\CryptoNews\Endpoints\Market::class, $client->market);
        $this->assertInstanceOf(\CryptoNews\Endpoints\DeFi::class, $client->defi);
        $this->assertInstanceOf(\CryptoNews\Endpoints\OnChain::class, $client->onchain);
    }

    public function testRssUrlDefault(): void
    {
        $client = new Client('https://example.com');
        $this->assertSame('https://example.com/api/rss', $client->rssUrl());
    }

    public function testRssUrlWithFeed(): void
    {
        $client = new Client('https://example.com');
        $this->assertSame('https://example.com/api/rss?feed=bitcoin', $client->rssUrl('bitcoin'));
    }

    public function testAtomUrlDefault(): void
    {
        $client = new Client('https://example.com');
        $this->assertSame('https://example.com/api/atom', $client->atomUrl());
    }

    public function testAtomUrlWithFeed(): void
    {
        $client = new Client('https://example.com');
        $this->assertSame('https://example.com/api/atom?feed=defi', $client->atomUrl('defi'));
    }

    public function testTrailingSlashStripped(): void
    {
        $client = new Client('https://example.com/');
        $this->assertSame('https://example.com/api/rss', $client->rssUrl());
    }
}
