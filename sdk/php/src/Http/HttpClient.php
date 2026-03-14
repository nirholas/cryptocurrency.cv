<?php

namespace CryptoNews\Http;

use CryptoNews\Cache\CacheInterface;
use CryptoNews\Exceptions\ApiException;
use CryptoNews\Exceptions\RateLimitException;

class HttpClient
{
    private string $baseUrl;
    private int $timeout;
    private int $maxRetries;
    private ?CacheInterface $cache;
    private int $defaultCacheTtl;

    /** @var array{remaining: int|null, limit: int|null, reset: int|null} */
    private array $rateLimitInfo = ['remaining' => null, 'limit' => null, 'reset' => null];

    public function __construct(
        string $baseUrl,
        int $timeout = 30,
        int $maxRetries = 2,
        ?CacheInterface $cache = null,
        int $defaultCacheTtl = 60
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
        $this->maxRetries = $maxRetries;
        $this->cache = $cache;
        $this->defaultCacheTtl = $defaultCacheTtl;
    }

    /**
     * Make a GET request to the API.
     *
     * @param string $endpoint API endpoint path
     * @param array<string, mixed> $params Query parameters
     * @param int|null $cacheTtl Override cache TTL (0 to skip cache)
     * @return array<string, mixed> Decoded JSON response
     * @throws ApiException On request failure
     * @throws RateLimitException On 429 status
     */
    public function get(string $endpoint, array $params = [], ?int $cacheTtl = null): array
    {
        $url = $this->baseUrl . $endpoint;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ttl = $cacheTtl ?? $this->defaultCacheTtl;

        // Check cache first
        if ($this->cache !== null && $ttl > 0) {
            $cached = $this->cache->get($url);
            if ($cached !== null) {
                return $cached;
            }
        }

        $lastException = null;

        for ($attempt = 0; $attempt <= $this->maxRetries; $attempt++) {
            if ($attempt > 0) {
                usleep(500000 * $attempt); // 0.5s, 1s backoff
            }

            try {
                $data = $this->executeRequest($url);

                // Store in cache
                if ($this->cache !== null && $ttl > 0) {
                    $this->cache->set($url, $data, $ttl);
                }

                return $data;
            } catch (RateLimitException $e) {
                throw $e; // Don't retry rate limits
            } catch (ApiException $e) {
                $lastException = $e;
                if ($e->getStatusCode() >= 400 && $e->getStatusCode() < 500) {
                    throw $e; // Don't retry client errors
                }
            }
        }

        throw $lastException ?? new ApiException("Request failed after {$this->maxRetries} retries");
    }

    /**
     * Get rate limit info from the most recent API response.
     *
     * @return array{remaining: int|null, limit: int|null, reset: int|null}
     */
    public function getRateLimitInfo(): array
    {
        return $this->rateLimitInfo;
    }

    /**
     * @return array<string, mixed>
     */
    private function executeRequest(string $url): array
    {
        $ch = curl_init();

        $responseHeaders = [];
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: CryptoNewsPHP/2.0',
            ],
            CURLOPT_HEADERFUNCTION => function ($ch, string $header) use (&$responseHeaders) {
                $parts = explode(':', $header, 2);
                if (count($parts) === 2) {
                    $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
                }
                return strlen($header);
            },
        ]);

        $response = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Track rate limit headers
        $this->rateLimitInfo = [
            'remaining' => isset($responseHeaders['x-ratelimit-remaining']) ? (int) $responseHeaders['x-ratelimit-remaining'] : null,
            'limit' => isset($responseHeaders['x-ratelimit-limit']) ? (int) $responseHeaders['x-ratelimit-limit'] : null,
            'reset' => isset($responseHeaders['x-ratelimit-reset']) ? (int) $responseHeaders['x-ratelimit-reset'] : null,
        ];

        if ($response === false) {
            throw new ApiException("cURL error: $error", 0);
        }

        /** @var string $response */
        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ApiException('Invalid JSON response: ' . json_last_error_msg(), $statusCode);
        }

        if ($statusCode === 429) {
            $retryAfter = isset($responseHeaders['retry-after']) ? (int) $responseHeaders['retry-after'] : 60;
            throw new RateLimitException('Rate limit exceeded', $retryAfter, $data);
        }

        if ($statusCode >= 400) {
            $message = $data['error'] ?? $data['message'] ?? "HTTP $statusCode error";
            throw new ApiException($message, $statusCode, $data);
        }

        return $data;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }
}
