<?php

namespace CryptoNews\Cache;

/**
 * Simple in-memory cache with TTL support.
 * Suitable for single-request caching in PHP (e.g., avoid duplicate API calls within one page load).
 */
class MemoryCache implements CacheInterface
{
    /** @var array<string, array{value: mixed, expires: int}> */
    private array $store = [];

    public function get(string $key)
    {
        if (!isset($this->store[$key])) {
            return null;
        }

        if ($this->store[$key]['expires'] < time()) {
            unset($this->store[$key]);
            return null;
        }

        return $this->store[$key]['value'];
    }

    /**
     * @param mixed $value
     */
    public function set(string $key, $value, int $ttl = 60): void
    {
        $this->store[$key] = [
            'value' => $value,
            'expires' => time() + $ttl,
        ];
    }

    public function delete(string $key): void
    {
        unset($this->store[$key]);
    }

    public function clear(): void
    {
        $this->store = [];
    }
}
