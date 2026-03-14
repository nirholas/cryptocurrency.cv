<?php

namespace CryptoNews\Models;

class Price
{
    public string $symbol;
    public float $price;
    public ?float $change24h;
    public ?float $marketCap;
    public ?float $volume24h;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->symbol = $data['symbol'] ?? '';
        $this->price = (float) ($data['price'] ?? 0);
        $this->change24h = isset($data['change24h']) ? (float) $data['change24h'] : null;
        $this->marketCap = isset($data['marketCap']) ? (float) $data['marketCap'] : null;
        $this->volume24h = isset($data['volume24h']) ? (float) $data['volume24h'] : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'symbol' => $this->symbol,
            'price' => $this->price,
            'change24h' => $this->change24h,
            'marketCap' => $this->marketCap,
            'volume24h' => $this->volume24h,
        ];
    }
}
