<?php

namespace CryptoNews\Tests\Http;

use CryptoNews\Exceptions\ApiException;
use CryptoNews\Exceptions\RateLimitException;
use CryptoNews\Http\HttpClient;
use PHPUnit\Framework\TestCase;

class HttpClientTest extends TestCase
{
    public function testGetBaseUrl(): void
    {
        $http = new HttpClient('https://cryptocurrency.cv');
        $this->assertSame('https://cryptocurrency.cv', $http->getBaseUrl());
    }

    public function testTrailingSlashStripped(): void
    {
        $http = new HttpClient('https://cryptocurrency.cv/');
        $this->assertSame('https://cryptocurrency.cv', $http->getBaseUrl());
    }

    public function testApiExceptionHasStatusCode(): void
    {
        $e = new ApiException('Not found', 404, ['error' => 'Not found']);
        $this->assertSame(404, $e->getStatusCode());
        $this->assertSame(['error' => 'Not found'], $e->getResponseBody());
        $this->assertSame('Not found', $e->getMessage());
    }

    public function testRateLimitExceptionHasRetryAfter(): void
    {
        $e = new RateLimitException('Rate limited', 120);
        $this->assertSame(429, $e->getStatusCode());
        $this->assertSame(120, $e->getRetryAfter());
    }

    public function testRateLimitExceptionDefaults(): void
    {
        $e = new RateLimitException();
        $this->assertSame(60, $e->getRetryAfter());
        $this->assertSame('Rate limit exceeded', $e->getMessage());
    }
}
