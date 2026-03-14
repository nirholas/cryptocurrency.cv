<?php

namespace CryptoNews\Exceptions;

class RateLimitException extends ApiException
{
    private int $retryAfter;

    public function __construct(string $message = 'Rate limit exceeded', int $retryAfter = 60, ?array $responseBody = null, ?\Throwable $previous = null)
    {
        $this->retryAfter = $retryAfter;
        parent::__construct($message, 429, $responseBody, $previous);
    }

    public function getRetryAfter(): int
    {
        return $this->retryAfter;
    }
}
