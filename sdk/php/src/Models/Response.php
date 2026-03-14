<?php

namespace CryptoNews\Models;

class Response
{
    /** @var array<string, mixed> */
    private array $data;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function getData(): array
    {
        return $this->data;
    }

    /**
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        return $this->data[$key] ?? $default;
    }

    /**
     * Get articles from the response, mapped to Article models.
     *
     * @return Article[]
     */
    public function getArticles(): array
    {
        $articles = $this->data['articles'] ?? [];
        return array_map(function (array $item) {
            return new Article($item);
        }, $articles);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->data;
    }
}
