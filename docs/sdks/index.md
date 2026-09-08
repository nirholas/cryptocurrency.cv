# SDKs Overview

Official SDKs for the Free Crypto News API, in **8 languages**. All of them are free and need no API key.

!!! warning "Only the TypeScript/JavaScript SDK is published to a registry"
    `@nirholas/crypto-news` is on npm. Every other SDK ships from the
    repository: install it from a clone, vendor the single file, or point your
    package manager at the git repo. The commands below reflect that; a
    `pip install`, `gem install` or `cargo add` of these names will not resolve.

## Installation

=== "Python"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/cryptocurrency.cv/main/sdk/python/crypto_news.py
    ```

=== "JavaScript"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/cryptocurrency.cv/main/sdk/javascript/crypto-news.js
    ```

=== "TypeScript"

    ```bash
    npm install @nirholas/crypto-news
    ```

=== "React"

    ```bash
    # Not on npm yet: build and link from a clone
    git clone https://github.com/nirholas/cryptocurrency.cv.git
    cd cryptocurrency.cv/sdk/react && npm install && npm run build && npm link
    ```

=== "Go"

    ```bash
    go get github.com/nirholas/cryptocurrency.cv/sdk/go
    ```

=== "Rust"

    ```toml
    # Not on crates.io yet: depend on the repository
    [dependencies]
    fcn-sdk = { git = "https://github.com/nirholas/cryptocurrency.cv", branch = "main" }
    ```

=== "Ruby"

    ```bash
    # Not on RubyGems yet: build the gem from a clone
    git clone https://github.com/nirholas/cryptocurrency.cv.git
    cd cryptocurrency.cv/sdk/ruby && gem build fcn-sdk.gemspec && gem install ./fcn-sdk-*.gem
    ```

=== "PHP"

    ```bash
    # Zero dependencies - just copy the file
    curl -O https://raw.githubusercontent.com/nirholas/cryptocurrency.cv/main/sdk/php/CryptoNews.php
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
