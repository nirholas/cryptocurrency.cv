<?php

namespace CryptoNews\Cache;

/**
 * Cache interface for the CryptoNews SDK.
 */
interface CacheInterface
{
    /**
     * Get a cached value by key.
     *
     * @return mixed|null Returns null if not found or expired
     */
    public function get(string $key);

    /**
     * Store a value in cache with a TTL in seconds.
     *
     * @param mixed $value
     */
    public function set(string $key, $value, int $ttl = 60): void;

    /**
     * Remove a cached value.
     */
    public function delete(string $key): void;

    /**
     * Clear all cached values.
     */
    public function clear(): void;
}
