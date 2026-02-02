# SDKs Overview

Official SDKs for Free Crypto News API, available in **8 languages**. All SDKs are **100% FREE** - no API keys required!

## Installation

=== "Python"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
    ```

=== "JavaScript"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/javascript/crypto-news.js
    ```

=== "TypeScript"

    ```bash
    npm install @nirholas/crypto-news
    ```

=== "React"

    ```bash
    npm install @nirholas/react-crypto-news
    ```

=== "Go"

    ```bash
    go get github.com/nirholas/free-crypto-news/sdk/go
    ```

=== "Rust"

    ```bash
    cargo add fcn-sdk
    ```

=== "Ruby"

    ```bash
    gem install fcn-sdk
    ```

=== "PHP"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/php/CryptoNews.php
    ```

## Feature Parity Matrix

| Feature | Python | JS | TS | Go | Rust | Ruby | PHP | React |
|---------|--------|----|----|-------|------|------|-----|-------|
| Get Latest News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DeFi News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bitcoin News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Breaking News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trending Topics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sentiment Analysis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Historical Archive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Original Sources | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Portfolio News | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Health Check | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| WebSocket | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Async/Await | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Type Definitions | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Zero Dependencies | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## SDK Comparison

| SDK | Async | Types | Real-time | Zero Deps |
|-----|-------|-------|-----------|-----------|
| Python | ✅ stdlib | ❌ | ❌ | ✅ |
| JavaScript | ✅ Promise | ❌ | ❌ | ✅ |
| TypeScript | ✅ Promise | ✅ Full | ❌ | ❌ |
| React | ✅ Hooks | ✅ Full | ❌ | ❌ |
| Go | ✅ Goroutines | ✅ Structs | ❌ | ❌ |
| Rust | ✅ Tokio | ✅ Full | ✅ WebSocket | ❌ |
| Ruby | ✅ Thread | ❌ | ❌ | ✅ |
| PHP | ❌ | ❌ | ❌ | ✅ |

## Choose Your SDK

<div class="grid" markdown>

<div class="card" markdown>
### [:fontawesome-brands-python: Python](python.md)
Best for data science, scripts, and backend services. Zero dependencies!
</div>

<div class="card" markdown>
### [:fontawesome-brands-js: JavaScript](javascript.md)
Best for Node.js backends and vanilla JS frontends. Works in browsers too.
</div>

<div class="card" markdown>
### [:simple-typescript: TypeScript](typescript.md)
Best for type-safe applications. Full type definitions for all API responses.
</div>

<div class="card" markdown>
### [:fontawesome-brands-react: React](react.md)
Best for React apps. Includes hooks (`useCryptoNews`) and drop-in components.
</div>

<div class="card" markdown>
### [:fontawesome-brands-golang: Go](go.md)
Best for high-performance services. Full struct types and error handling.
</div>

<div class="card" markdown>
### [:fontawesome-brands-rust: Rust](rust.md)
Best for performance-critical apps. Async/await with Tokio, WebSocket streaming.
</div>

<div class="card" markdown>
### [:fontawesome-solid-gem: Ruby](ruby.md)
Best for Ruby on Rails and Sinatra apps. Thread-safe with retries.
</div>

<div class="card" markdown>
### [:fontawesome-brands-php: PHP](php.md)
Best for WordPress plugins and PHP backends. Simple and straightforward.
</div>

</div>
