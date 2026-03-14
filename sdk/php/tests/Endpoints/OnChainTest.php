<?php

namespace CryptoNews\Tests\Endpoints;

use CryptoNews\Endpoints\OnChain;
use CryptoNews\Models\Response;
use CryptoNews\Tests\TestCase;

class OnChainTest extends TestCase
{
    public function testWhaleAlertsReturnsResponse(): void
    {
        $http = $this->mockHttp([
            'alerts' => [
                ['hash' => '0xabc', 'amount' => 5000000, 'token' => 'USDT'],
            ],
        ]);
        $onchain = new OnChain($http);
        $response = $onchain->whaleAlerts(10);

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame('0xabc', $response->get('alerts')[0]['hash']);
    }

    public function testGasReturnsResponse(): void
    {
        $http = $this->mockHttp(['fast' => 25, 'standard' => 15, 'slow' => 8]);
        $onchain = new OnChain($http);
        $response = $onchain->gas();

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(25, $response->get('fast'));
    }
}
