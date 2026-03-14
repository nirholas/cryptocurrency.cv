<?php

namespace CryptoNews\Cache;

/**
 * File-based cache for persistence across requests.
 * Useful for CLI scripts, cron jobs, or when you want to avoid hitting the API on every page load.
 */
class FileCache implements CacheInterface
{
    private string $directory;

    public function __construct(string $directory = '')
    {
        $this->directory = $directory ?: sys_get_temp_dir() . '/crypto-news-cache';
        if (!is_dir($this->directory)) {
            mkdir($this->directory, 0750, true);
        }
    }

    public function get(string $key)
    {
        $file = $this->path($key);
        if (!file_exists($file)) {
            return null;
        }

        $raw = file_get_contents($file);
        if ($raw === false) {
            return null;
        }

        $entry = json_decode($raw, true);
        if (!is_array($entry) || ($entry['expires'] ?? 0) < time()) {
            @unlink($file);
            return null;
        }

        return $entry['value'];
    }

    /**
     * @param mixed $value
     */
    public function set(string $key, $value, int $ttl = 60): void
    {
        $file = $this->path($key);
        $entry = json_encode([
            'value' => $value,
            'expires' => time() + $ttl,
        ]);
        file_put_contents($file, $entry, LOCK_EX);
    }

    public function delete(string $key): void
    {
        $file = $this->path($key);
        if (file_exists($file)) {
            @unlink($file);
        }
    }

    public function clear(): void
    {
        $files = glob($this->directory . '/*.cache');
        if ($files) {
            foreach ($files as $file) {
                @unlink($file);
            }
        }
    }

    private function path(string $key): string
    {
        return $this->directory . '/' . md5($key) . '.cache';
    }
}
