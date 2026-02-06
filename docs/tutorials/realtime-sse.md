# 📡 Real-Time Streaming Tutorial

Stream live updates using Server-Sent Events (SSE) and WebSocket connections.

---

## Endpoints Covered

| Endpoint | Type | Description |
|----------|------|-------------|
| `GET /api/sse` | SSE | Real-time news stream |
| `GET /api/ws` | WebSocket | WebSocket connection info |

---

## Server-Sent Events (SSE)

Stream real-time updates without WebSocket complexity.

### Event Types

| Event | Description |
|-------|-------------|
| `connected` | Connection established |
| `news` | New article published |
| `breaking` | Breaking news alert |
| `price` | Price update |
| `heartbeat` | Keep-alive (every 30s) |

---

## Browser Implementation

=== "JavaScript (Browser)"

    ```html
    <!DOCTYPE html>
    <html>
    <head>
        <title>Crypto News Stream</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .news-item { 
                padding: 15px; 
                margin: 10px 0; 
                border-left: 4px solid #007bff; 
                background: #f8f9fa;
            }
            .breaking { border-color: #dc3545; background: #fff3cd; }
            .status { 
                padding: 10px; 
                background: #d4edda; 
                border-radius: 5px; 
            }
            .status.disconnected { background: #f8d7da; }
        </style>
    </head>
    <body>
        <h1>📡 Crypto News Live Stream</h1>
        <div id="status" class="status">Connecting...</div>
        <div id="news-feed"></div>
        
        <script>
            const BASE_URL = "https://cryptocurrency.cv";
            const statusEl = document.getElementById("status");
            const feedEl = document.getElementById("news-feed");
            
            let eventSource;
            let reconnectAttempts = 0;
            const MAX_RECONNECT_DELAY = 30000;
            
            function connect() {
                eventSource = new EventSource(`${BASE_URL}/api/sse`);
                
                eventSource.onopen = () => {
                    statusEl.className = "status";
                    statusEl.textContent = "🟢 Connected - Streaming live updates";
                    reconnectAttempts = 0;
                };
                
                eventSource.onerror = () => {
                    statusEl.className = "status disconnected";
                    statusEl.textContent = "🔴 Disconnected - Reconnecting...";
                    
                    eventSource.close();
                    
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
                    reconnectAttempts++;
                    
                    setTimeout(connect, delay);
                };
                
                // Handle different event types
                eventSource.addEventListener("connected", (e) => {
                    console.log("Connected:", JSON.parse(e.data));
                });
                
                eventSource.addEventListener("news", (e) => {
                    const article = JSON.parse(e.data);
                    addNewsItem(article, false);
                });
                
                eventSource.addEventListener("breaking", (e) => {
                    const article = JSON.parse(e.data);
                    addNewsItem(article, true);
                    
                    // Optional: Browser notification
                    if (Notification.permission === "granted") {
                        new Notification("🔴 Breaking News", {
                            body: article.title,
                            icon: "/favicon.ico"
                        });
                    }
                });
                
                eventSource.addEventListener("price", (e) => {
                    const price = JSON.parse(e.data);
                    console.log("Price update:", price);
                });
                
                eventSource.addEventListener("heartbeat", (e) => {
                    console.log("Heartbeat:", new Date().toISOString());
                });
            }
            
            function addNewsItem(article, isBreaking) {
                const item = document.createElement("div");
                item.className = `news-item ${isBreaking ? "breaking" : ""}`;
                item.innerHTML = `
                    <strong>${isBreaking ? "🔴 BREAKING: " : ""}${article.title}</strong>
                    <p>${article.description || ""}</p>
                    <small>
                        ${article.source} | ${article.timeAgo || new Date().toLocaleTimeString()}
                        | <a href="${article.link}" target="_blank">Read more</a>
                    </small>
                `;
                
                // Add at top
                feedEl.insertBefore(item, feedEl.firstChild);
                
                // Limit items
                while (feedEl.children.length > 50) {
                    feedEl.removeChild(feedEl.lastChild);
                }
            }
            
            // Request notification permission
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            
            // Start connection
            connect();
            
            // Cleanup on page unload
            window.addEventListener("beforeunload", () => {
                if (eventSource) eventSource.close();
            });
        </script>
    </body>
    </html>
    ```

---

## Node.js Implementation

=== "JavaScript (Node.js)"

    ```javascript
    /**
     * Node.js SSE Client
     * Requires: npm install eventsource
     */
    
    const EventSource = require("eventsource");
    
    const BASE_URL = "https://cryptocurrency.cv";
    
    class CryptoNewsStream {
        constructor() {
            this.eventSource = null;
            this.reconnectAttempts = 0;
            this.maxReconnectDelay = 30000;
            this.handlers = {
                news: [],
                breaking: [],
                price: [],
                error: [],
            };
        }
        
        connect() {
            console.log("🔌 Connecting to stream...");
            
            this.eventSource = new EventSource(`${BASE_URL}/api/sse`);
            
            this.eventSource.onopen = () => {
                console.log("🟢 Connected to live stream");
                this.reconnectAttempts = 0;
            };
            
            this.eventSource.onerror = (error) => {
                console.error("🔴 Connection error:", error.message || "Unknown");
                this.handleReconnect();
            };
            
            // Event handlers
            this.eventSource.addEventListener("connected", (e) => {
                const data = JSON.parse(e.data);
                console.log("📡 Stream info:", data);
            });
            
            this.eventSource.addEventListener("news", (e) => {
                const article = JSON.parse(e.data);
                this.emit("news", article);
            });
            
            this.eventSource.addEventListener("breaking", (e) => {
                const article = JSON.parse(e.data);
                this.emit("breaking", article);
            });
            
            this.eventSource.addEventListener("price", (e) => {
                const price = JSON.parse(e.data);
                this.emit("price", price);
            });
            
            this.eventSource.addEventListener("heartbeat", () => {
                // Silent heartbeat
            });
        }
        
        handleReconnect() {
            if (this.eventSource) {
                this.eventSource.close();
            }
            
            const delay = Math.min(
                1000 * Math.pow(2, this.reconnectAttempts),
                this.maxReconnectDelay
            );
            
            console.log(`⏳ Reconnecting in ${delay / 1000}s...`);
            this.reconnectAttempts++;
            
            setTimeout(() => this.connect(), delay);
        }
        
        on(event, handler) {
            if (this.handlers[event]) {
                this.handlers[event].push(handler);
            }
            return this;
        }
        
        emit(event, data) {
            if (this.handlers[event]) {
                this.handlers[event].forEach(handler => handler(data));
            }
        }
        
        disconnect() {
            if (this.eventSource) {
                this.eventSource.close();
                console.log("🔌 Disconnected");
            }
        }
    }
    
    // Usage
    const stream = new CryptoNewsStream();
    
    stream
        .on("news", (article) => {
            console.log(`\n📰 ${article.title}`);
            console.log(`   Source: ${article.source}`);
        })
        .on("breaking", (article) => {
            console.log(`\n🔴 BREAKING: ${article.title}`);
            console.log(`   Source: ${article.source}`);
        })
        .on("price", (price) => {
            console.log(`💰 ${price.symbol}: $${price.price}`);
        });
    
    stream.connect();
    
    // Graceful shutdown
    process.on("SIGINT", () => {
        stream.disconnect();
        process.exit(0);
    });
    ```

=== "TypeScript"

    ```typescript
    import EventSource from "eventsource";
    
    interface Article {
        title: string;
        link: string;
        description?: string;
        source: string;
        timeAgo?: string;
        pubDate: string;
    }
    
    interface PriceUpdate {
        symbol: string;
        price: number;
        change24h: number;
    }
    
    type EventHandler<T> = (data: T) => void;
    
    class CryptoNewsStream {
        private eventSource: EventSource | null = null;
        private reconnectAttempts = 0;
        private readonly maxReconnectDelay = 30000;
        private readonly baseUrl: string;
        
        private newsHandlers: EventHandler<Article>[] = [];
        private breakingHandlers: EventHandler<Article>[] = [];
        private priceHandlers: EventHandler<PriceUpdate>[] = [];
        
        constructor(baseUrl = "https://cryptocurrency.cv") {
            this.baseUrl = baseUrl;
        }
        
        connect(): void {
            console.log("🔌 Connecting...");
            
            this.eventSource = new EventSource(`${this.baseUrl}/api/sse`);
            
            this.eventSource.onopen = () => {
                console.log("🟢 Connected");
                this.reconnectAttempts = 0;
            };
            
            this.eventSource.onerror = () => {
                this.handleReconnect();
            };
            
            this.eventSource.addEventListener("news", (e: MessageEvent) => {
                const article: Article = JSON.parse(e.data);
                this.newsHandlers.forEach(h => h(article));
            });
            
            this.eventSource.addEventListener("breaking", (e: MessageEvent) => {
                const article: Article = JSON.parse(e.data);
                this.breakingHandlers.forEach(h => h(article));
            });
            
            this.eventSource.addEventListener("price", (e: MessageEvent) => {
                const price: PriceUpdate = JSON.parse(e.data);
                this.priceHandlers.forEach(h => h(price));
            });
        }
        
        private handleReconnect(): void {
            this.eventSource?.close();
            
            const delay = Math.min(
                1000 * Math.pow(2, this.reconnectAttempts),
                this.maxReconnectDelay
            );
            
            console.log(`⏳ Reconnecting in ${delay / 1000}s...`);
            this.reconnectAttempts++;
            
            setTimeout(() => this.connect(), delay);
        }
        
        onNews(handler: EventHandler<Article>): this {
            this.newsHandlers.push(handler);
            return this;
        }
        
        onBreaking(handler: EventHandler<Article>): this {
            this.breakingHandlers.push(handler);
            return this;
        }
        
        onPrice(handler: EventHandler<PriceUpdate>): this {
            this.priceHandlers.push(handler);
            return this;
        }
        
        disconnect(): void {
            this.eventSource?.close();
        }
    }
    
    // Usage
    const stream = new CryptoNewsStream();
    
    stream
        .onNews((article) => {
            console.log(`📰 ${article.title}`);
        })
        .onBreaking((article) => {
            console.log(`🔴 BREAKING: ${article.title}`);
        })
        .onPrice((price) => {
            console.log(`💰 ${price.symbol}: $${price.price}`);
        });
    
    stream.connect();
    ```

---

## Python Implementation

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Python SSE Client
    Requires: pip install sseclient-py requests
    """
    
    import json
    import time
    import signal
    import sys
    from typing import Callable, Dict, Any, Optional
    
    import requests
    import sseclient
    
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    class CryptoNewsStream:
        def __init__(self, base_url: str = BASE_URL):
            self.base_url = base_url
            self.running = False
            self.handlers: Dict[str, list] = {
                "news": [],
                "breaking": [],
                "price": [],
                "error": [],
            }
        
        def on(self, event: str, handler: Callable) -> "CryptoNewsStream":
            """Register an event handler."""
            if event in self.handlers:
                self.handlers[event].append(handler)
            return self
        
        def emit(self, event: str, data: Any) -> None:
            """Emit an event to all handlers."""
            for handler in self.handlers.get(event, []):
                try:
                    handler(data)
                except Exception as e:
                    print(f"Handler error: {e}")
        
        def connect(self) -> None:
            """Connect to the SSE stream."""
            self.running = True
            reconnect_delay = 1
            max_delay = 30
            
            while self.running:
                try:
                    print("🔌 Connecting to stream...")
                    
                    response = requests.get(
                        f"{self.base_url}/api/sse",
                        stream=True,
                        headers={"Accept": "text/event-stream"},
                        timeout=60
                    )
                    response.raise_for_status()
                    
                    client = sseclient.SSEClient(response)
                    print("🟢 Connected to live stream")
                    reconnect_delay = 1  # Reset on successful connection
                    
                    for event in client.events():
                        if not self.running:
                            break
                        
                        try:
                            data = json.loads(event.data) if event.data else {}
                        except json.JSONDecodeError:
                            data = event.data
                        
                        if event.event == "connected":
                            print(f"📡 Stream info: {data}")
                        
                        elif event.event == "news":
                            self.emit("news", data)
                        
                        elif event.event == "breaking":
                            self.emit("breaking", data)
                        
                        elif event.event == "price":
                            self.emit("price", data)
                        
                        elif event.event == "heartbeat":
                            pass  # Silent heartbeat
                
                except requests.exceptions.RequestException as e:
                    print(f"🔴 Connection error: {e}")
                    self.emit("error", e)
                
                except Exception as e:
                    print(f"🔴 Error: {e}")
                    self.emit("error", e)
                
                if self.running:
                    print(f"⏳ Reconnecting in {reconnect_delay}s...")
                    time.sleep(reconnect_delay)
                    reconnect_delay = min(reconnect_delay * 2, max_delay)
        
        def disconnect(self) -> None:
            """Disconnect from the stream."""
            self.running = False
            print("🔌 Disconnected")
    
    
    def main():
        stream = CryptoNewsStream()
        
        # Register handlers
        @stream.on("news", lambda article: print(
            f"\n📰 {article.get('title', 'No title')}\n"
            f"   Source: {article.get('source', 'Unknown')}"
        ))
        
        @stream.on("breaking", lambda article: print(
            f"\n🔴 BREAKING: {article.get('title', 'No title')}\n"
            f"   Source: {article.get('source', 'Unknown')}"
        ))
        
        @stream.on("price", lambda price: print(
            f"💰 {price.get('symbol', 'N/A')}: ${price.get('price', 0):,.2f}"
        ))
        
        # Graceful shutdown
        def signal_handler(sig, frame):
            print("\n\n⏹️ Shutting down...")
            stream.disconnect()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        
        # Connect
        print("=" * 50)
        print("📡 CRYPTO NEWS LIVE STREAM")
        print("=" * 50)
        print("Press Ctrl+C to stop\n")
        
        stream.connect()
    
    
    if __name__ == "__main__":
        main()
    ```

=== "Python (asyncio)"

    ```python
    #!/usr/bin/env python3
    """
    Async Python SSE Client
    Requires: pip install aiohttp aiohttp-sse-client
    """
    
    import asyncio
    import json
    import signal
    from typing import Callable, Dict, Any
    
    import aiohttp
    from aiohttp_sse_client import client as sse_client
    
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    class AsyncCryptoNewsStream:
        def __init__(self, base_url: str = BASE_URL):
            self.base_url = base_url
            self.running = False
            self.handlers: Dict[str, list] = {
                "news": [],
                "breaking": [],
                "price": [],
            }
        
        def on(self, event: str) -> Callable:
            """Decorator to register event handlers."""
            def decorator(func: Callable) -> Callable:
                if event in self.handlers:
                    self.handlers[event].append(func)
                return func
            return decorator
        
        async def emit(self, event: str, data: Any) -> None:
            """Emit event to handlers."""
            for handler in self.handlers.get(event, []):
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(data)
                    else:
                        handler(data)
                except Exception as e:
                    print(f"Handler error: {e}")
        
        async def connect(self) -> None:
            """Connect to SSE stream."""
            self.running = True
            reconnect_delay = 1
            
            while self.running:
                try:
                    async with aiohttp.ClientSession() as session:
                        async with sse_client.EventSource(
                            f"{self.base_url}/api/sse",
                            session=session
                        ) as event_source:
                            print("🟢 Connected")
                            reconnect_delay = 1
                            
                            async for event in event_source:
                                if not self.running:
                                    break
                                
                                try:
                                    data = json.loads(event.data) if event.data else {}
                                except json.JSONDecodeError:
                                    data = event.data
                                
                                if event.type in self.handlers:
                                    await self.emit(event.type, data)
                
                except Exception as e:
                    print(f"🔴 Error: {e}")
                
                if self.running:
                    print(f"⏳ Reconnecting in {reconnect_delay}s...")
                    await asyncio.sleep(reconnect_delay)
                    reconnect_delay = min(reconnect_delay * 2, 30)
        
        def stop(self) -> None:
            self.running = False
    
    
    async def main():
        stream = AsyncCryptoNewsStream()
        
        @stream.on("news")
        async def handle_news(article):
            print(f"📰 {article.get('title', 'No title')}")
        
        @stream.on("breaking")
        async def handle_breaking(article):
            print(f"🔴 BREAKING: {article.get('title', 'No title')}")
        
        @stream.on("price")
        async def handle_price(price):
            print(f"💰 {price.get('symbol')}: ${price.get('price'):,.2f}")
        
        # Handle Ctrl+C
        loop = asyncio.get_event_loop()
        loop.add_signal_handler(signal.SIGINT, stream.stop)
        
        print("📡 Starting async stream...")
        await stream.connect()
    
    
    if __name__ == "__main__":
        asyncio.run(main())
    ```

---

## Filtered Streaming

Filter events on the client side:

=== "Python"

    ```python
    def create_filtered_stream(
        keywords: list = None,
        sources: list = None,
        breaking_only: bool = False
    ):
        """Create a filtered news stream."""
        stream = CryptoNewsStream()
        
        def matches_filter(article: dict) -> bool:
            # Source filter
            if sources:
                if article.get("sourceKey", "").lower() not in [s.lower() for s in sources]:
                    return False
            
            # Keyword filter
            if keywords:
                title = article.get("title", "").lower()
                description = article.get("description", "").lower()
                text = f"{title} {description}"
                if not any(kw.lower() in text for kw in keywords):
                    return False
            
            return True
        
        @stream.on("news", lambda article: (
            print(f"📰 {article.get('title')}")
            if not breaking_only and matches_filter(article)
            else None
        ))
        
        @stream.on("breaking", lambda article: (
            print(f"🔴 BREAKING: {article.get('title')}")
            if matches_filter(article)
            else None
        ))
        
        return stream
    
    
    # Only Bitcoin news from CoinDesk and The Block
    stream = create_filtered_stream(
        keywords=["bitcoin", "btc"],
        sources=["coindesk", "theblock"]
    )
    stream.connect()
    ```

=== "JavaScript"

    ```javascript
    function createFilteredStream(options = {}) {
        const { keywords = [], sources = [], breakingOnly = false } = options;
        
        const stream = new CryptoNewsStream();
        
        function matchesFilter(article) {
            // Source filter
            if (sources.length > 0) {
                if (!sources.map(s => s.toLowerCase())
                    .includes(article.sourceKey?.toLowerCase())) {
                    return false;
                }
            }
            
            // Keyword filter
            if (keywords.length > 0) {
                const text = `${article.title} ${article.description}`.toLowerCase();
                if (!keywords.some(kw => text.includes(kw.toLowerCase()))) {
                    return false;
                }
            }
            
            return true;
        }
        
        stream.on("news", (article) => {
            if (!breakingOnly && matchesFilter(article)) {
                console.log(`📰 ${article.title}`);
            }
        });
        
        stream.on("breaking", (article) => {
            if (matchesFilter(article)) {
                console.log(`🔴 BREAKING: ${article.title}`);
            }
        });
        
        return stream;
    }
    
    // Only Bitcoin news
    const stream = createFilteredStream({
        keywords: ["bitcoin", "btc"],
        sources: ["coindesk", "theblock"]
    });
    stream.connect();
    ```

---

## WebSocket Info

Get WebSocket connection details:

=== "Python"

    ```python
    def get_ws_info() -> dict:
        """Get WebSocket connection information."""
        response = requests.get(f"{BASE_URL}/api/ws")
        return response.json()
    
    # Get WebSocket info
    ws_info = get_ws_info()
    
    print("🔌 WEBSOCKET CONNECTION INFO")
    print("=" * 50)
    print(f"URL: {ws_info.get('url', 'N/A')}")
    print(f"Protocol: {ws_info.get('protocol', 'N/A')}")
    print(f"Channels: {', '.join(ws_info.get('channels', []))}")
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/ws"
    ```

---

## Next Steps

- [Webhooks](user-webhooks.md) - Set up webhook notifications
- [Alerts System](user-alerts.md) - Create custom alerts
- [Trading Signals](trading-signals.md) - Real-time trading signals
