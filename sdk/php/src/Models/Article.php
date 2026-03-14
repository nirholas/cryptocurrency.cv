<?php

namespace CryptoNews\Models;

class Article implements \JsonSerializable
{
    public string $title;
    public string $link;
    public string $source;
    public string $timeAgo;
    public ?string $description;
    public ?string $category;
    public ?string $sentiment;
    public ?string $publishedAt;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->title = $data['title'] ?? '';
        $this->link = $data['link'] ?? '';
        $this->source = $data['source'] ?? '';
        $this->timeAgo = $data['timeAgo'] ?? '';
        $this->description = $data['description'] ?? null;
        $this->category = $data['category'] ?? null;
        $this->sentiment = $data['sentiment'] ?? null;
        $this->publishedAt = $data['publishedAt'] ?? null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'link' => $this->link,
            'source' => $this->source,
            'timeAgo' => $this->timeAgo,
            'description' => $this->description,
            'category' => $this->category,
            'sentiment' => $this->sentiment,
            'publishedAt' => $this->publishedAt,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
