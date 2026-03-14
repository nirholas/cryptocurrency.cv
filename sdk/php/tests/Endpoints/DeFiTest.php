<?php

namespace CryptoNews\Tests\Endpoints;

use CryptoNews\Endpoints\DeFi;
use CryptoNews\Models\Response;
use CryptoNews\Tests\TestCase;

class DeFiTest extends TestCase
{
    public function testTvlReturnsResponse(): void
    {
        $http = $this->mockHttp(['totalTvl' => 180000000000, 'chains' => []]);
        $defi = new DeFi($http);
        $response = $defi->tvl();

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame(180000000000, $response->get('totalTvl'));
    }

    public function testYieldsReturnsResponse(): void
    {
        $http = $this->mockHttp(['yields' => [['protocol' => 'Aave', 'apy' => 4.5]]]);
        $defi = new DeFi($http);
        $response = $defi->yields(10);

        $this->assertInstanceOf(Response::class, $response);
        $this->assertSame('Aave', $response->get('yields')[0]['protocol']);
    }
}
