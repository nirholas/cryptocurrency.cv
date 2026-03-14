<?php

namespace CryptoNews\Tests\Endpoints;

use CryptoNews\Endpoints\Market;
use CryptoNews\Models\Price;
use CryptoNews\Models\Response;
use CryptoNews\Tests\TestCase;

class MarketTest extends TestCase
{
    public function testPricesReturnsPriceModels(): void
    {
        $http = $this->mockHttp([
            'prices' => [
                ['symbol' => 'BTC', 'price' => 100000, 'change24h' => 2.5, 'marketCap' => 2000000000000, 'volume24h' => 50000000000],
                ['symbol' => 'ETH', 'price' => 5000, 'change24h' => -1.2],
            ],
        ]);
        $market = new Market($http);
        $prices = $market->prices('BTC,ETH');

        $this->assertCount(2, $prices);
        $this->assertInstanceOf(Price::class, $prices[0]);
        $this->assertSame('BTC', $prices[0]->symbol);
        $this->assertSame(100000.0, $prices[0]->price);
        $this->assertSame(2.5, $prices[0]->change24h);
        $this->assertNull($prices[1]->marketCap);
    }

    public function testFearGreedReturnsResponse(): void
    {
        $http = $this->mockHttp(['value' => 72, 'label' => 'Greed']);
        $market = new Market($http);
        $response = $market->fearGreed();

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(72, $response->get('value'));
        $this->assertSame('Greed', $response->get('label'));
    }

    public function testTrendingReturnsResponse(): void
    {
        $http = $this->mockHttp(['trending' => [['symbol' => 'SOL', 'mentions' => 150]]]);
        $market = new Market($http);
        $response = $market->trending(10);

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame('SOL', $response->get('trending')[0]['symbol']);
    }
}
