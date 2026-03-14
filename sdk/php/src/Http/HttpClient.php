<?php

namespace CryptoNews\Http;

use CryptoNews\Exceptions\ApiException;
use CryptoNews\Exceptions\RateLimitException;

class HttpClient
{
    private string $baseUrl;
    private int $timeout;
    private int $maxRetries;

    public function __construct(string $baseUrl, int $timeout = 30, int $maxRetries = 2)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
        $this->maxRetries = $maxRetries;
    }

    /**
     * Make a GET request to the API.
     *
     * @param string $endpoint API endpoint path
     * @param array<string, mixed> $params Query parameters
     * @return array<string, mixed> Decoded JSON response
     * @throws ApiException On request failure
     * @throws RateLimitException On 429 status
     */
    public function get(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . $endpoint;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $lastException = null;

        for ($attempt = 0; $attempt <= $this->maxRetries; $attempt++) {
            if ($attempt > 0) {
                usleep(500000 * $attempt); // 0.5s, 1s backoff
            }

            try {
                return $this->executeRequest($url);
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
     * @return array<string, mixed>
     */
    private function executeRequest(string $url): array
    {
        $ch = curl_init();
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
        ]);

        $response = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new ApiException("cURL error: $error", 0);
        }

        /** @var string $response */
        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ApiException('Invalid JSON response: ' . json_last_error_msg(), $statusCode);
        }

        if ($statusCode === 429) {
            throw new RateLimitException('Rate limit exceeded', 60, $data);
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
