<?php

namespace CryptoNews\Tests;

use CryptoNews\Http\HttpClient;

/**
 * Base test case that provides a mock HttpClient.
 */
abstract class TestCase extends \PHPUnit\Framework\TestCase
{
    /**
     * Create a mock HttpClient that returns the given data for any get() call.
     *
     * @param array<string, mixed> $responseData
     */
    protected function mockHttp(array $responseData): HttpClient
    {
        $mock = $this->createMock(HttpClient::class);
        $mock->method('get')->willReturn($responseData);
        $mock->method('getBaseUrl')->willReturn('https://cryptocurrency.cv');
        return $mock;
    }

    /**
     * Create a mock HttpClient that returns different data based on the endpoint.
     *
     * @param array<string, array<string, mixed>> $endpointMap Maps endpoint prefix to response data
     */
    protected function mockHttpMap(array $endpointMap): HttpClient
    {
        $mock = $this->createMock(HttpClient::class);
        $mock->method('get')->willReturnCallback(function (string $endpoint) use ($endpointMap) {
            foreach ($endpointMap as $prefix => $data) {
                if (str_starts_with($endpoint, $prefix)) {
                    return $data;
                }
            }
            return [];
        });
        $mock->method('getBaseUrl')->willReturn('https://cryptocurrency.cv');
        return $mock;
    }
}
