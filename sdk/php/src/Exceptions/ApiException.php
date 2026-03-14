<?php

namespace CryptoNews\Exceptions;

use Exception;

class ApiException extends Exception
{
    private int $statusCode;
    private ?array $responseBody;

    public function __construct(string $message, int $statusCode = 0, ?array $responseBody = null, ?\Throwable $previous = null)
    {
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
        parent::__construct($message, $statusCode, $previous);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getResponseBody(): ?array
    {
        return $this->responseBody;
    }
}
