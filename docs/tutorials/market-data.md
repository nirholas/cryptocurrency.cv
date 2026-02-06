# Market Data Tutorial

This tutorial covers all market data endpoints for coins, exchanges, OHLC data, and derivatives.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/market/coins` | Coin market data |
| `/api/market/ohlc/[coinId]` | OHLC candlestick data |
| `/api/market/exchanges` | Exchange data |
| `/api/market/derivatives` | Derivatives data |
| `/api/market/categories` | Market categories |
| `/api/market/search` | Market search |
| `/api/fear-greed` | Fear & Greed Index |

---

## 1. Coin Market Data

Get comprehensive market data for cryptocurrencies.

=== "Python"
    ```python
    import requests
    
    def get_coins(
        ids: str = None,
        vs_currency: str = "usd",
        order: str = "market_cap_desc",
        per_page: int = 100
    ):
        """Get coin market data."""
        params = {
            "vs_currency": vs_currency,
            "order": order,
            "per_page": per_page
        }
        if ids:
            params["ids"] = ids
        
        response = requests.get(
            "https://cryptocurrency.cv/api/market/coins",
            params=params
        )
        return response.json()
    
    # Get top 20 coins
    coins = get_coins(per_page=20)
    
    print("💰 Top Cryptocurrencies by Market Cap")
    print("=" * 70)
    print(f"{'#':<4} {'Name':<15} {'Price':<15} {'24h %':<10} {'Market Cap':<15}")
    print("-" * 70)
    
    for i, coin in enumerate(coins.get('coins', coins)[:20], 1):
        name = coin.get('name', 'Unknown')[:12]
        price = coin.get('current_price', 0)
        change = coin.get('price_change_percentage_24h', 0)
        mcap = coin.get('market_cap', 0)
        
        # Format values
        price_str = f"${price:,.2f}" if price < 1000 else f"${price:,.0f}"
        change_str = f"{change:+.2f}%"
        mcap_str = f"${mcap/1e9:.1f}B" if mcap >= 1e9 else f"${mcap/1e6:.1f}M"
        
        # Color indicator
        indicator = "🟢" if change > 0 else "🔴" if change < 0 else "⚪"
        
        print(f"{i:<4} {name:<15} {price_str:<15} {indicator} {change_str:<8} {mcap_str:<15}")
    
    # Get specific coins
    print("\n" + "=" * 70)
    print("📊 Specific Coins (BTC, ETH, SOL):")
    
    specific = get_coins(ids="bitcoin,ethereum,solana")
    for coin in specific.get('coins', specific):
        print(f"\n  {coin.get('symbol', '').upper()}:")
        print(f"    Price: ${coin.get('current_price', 0):,.2f}")
        print(f"    24h High: ${coin.get('high_24h', 0):,.2f}")
        print(f"    24h Low: ${coin.get('low_24h', 0):,.2f}")
        print(f"    Volume: ${coin.get('total_volume', 0)/1e9:.2f}B")
    ```

=== "JavaScript"
    ```javascript
    async function getCoins(options = {}) {
        const params = new URLSearchParams({
            vs_currency: options.vsCurrency || 'usd',
            order: options.order || 'market_cap_desc',
            per_page: (options.perPage || 100).toString()
        });
        if (options.ids) params.set('ids', options.ids);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/market/coins?${params}`
        );
        return response.json();
    }
    
    // Get top 20 coins
    const coins = await getCoins({ perPage: 20 });
    
    console.log("💰 Top Cryptocurrencies by Market Cap");
    console.log("=".repeat(70));
    
    const coinList = coins.coins || coins;
    coinList.slice(0, 20).forEach((coin, i) => {
        const price = coin.current_price || 0;
        const change = coin.price_change_percentage_24h || 0;
        const mcap = coin.market_cap || 0;
        
        const priceStr = price < 1000 ? `$${price.toFixed(2)}` : `$${price.toLocaleString()}`;
        const changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        const mcapStr = mcap >= 1e9 ? `$${(mcap/1e9).toFixed(1)}B` : `$${(mcap/1e6).toFixed(1)}M`;
        const indicator = change > 0 ? '🟢' : change < 0 ? '🔴' : '⚪';
        
        console.log(`${(i+1).toString().padEnd(4)} ${coin.name?.slice(0,12).padEnd(15)} ${priceStr.padEnd(15)} ${indicator} ${changeStr.padEnd(10)} ${mcapStr}`);
    });
    
    // Get specific coins
    console.log("\n📊 Specific Coins:");
    const specific = await getCoins({ ids: 'bitcoin,ethereum,solana' });
    (specific.coins || specific).forEach(coin => {
        console.log(`\n  ${coin.symbol?.toUpperCase()}:`);
        console.log(`    Price: $${coin.current_price?.toLocaleString()}`);
        console.log(`    24h Volume: $${(coin.total_volume/1e9).toFixed(2)}B`);
    });
    ```

=== "cURL"
    ```bash
    # Get top 20 coins
    curl "https://cryptocurrency.cv/api/market/coins?per_page=20&vs_currency=usd" | jq
    
    # Get specific coins
    curl "https://cryptocurrency.cv/api/market/coins?ids=bitcoin,ethereum,solana" | jq
    
    # Get coins sorted by volume
    curl "https://cryptocurrency.cv/api/market/coins?order=volume_desc&per_page=10" | jq
    
    # Get in different currency
    curl "https://cryptocurrency.cv/api/market/coins?vs_currency=eur&per_page=5" | jq
    ```

---

## 2. OHLC Candlestick Data

Get historical OHLC (Open, High, Low, Close) data for charting.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_ohlc(coin_id: str, days: int = 7, interval: str = None):
        """Get OHLC candlestick data."""
        params = {"days": days}
        if interval:
            params["interval"] = interval
        
        response = requests.get(
            f"https://cryptocurrency.cv/api/market/ohlc/{coin_id}",
            params=params
        )
        return response.json()
    
    # Get Bitcoin OHLC for last 7 days
    ohlc = get_ohlc("bitcoin", days=7)
    
    print("📈 Bitcoin OHLC Data (7 Days)")
    print("=" * 80)
    print(f"{'Date':<20} {'Open':<12} {'High':<12} {'Low':<12} {'Close':<12}")
    print("-" * 80)
    
    candles = ohlc.get('ohlc', ohlc)
    for candle in candles[:10]:
        # Handle different response formats
        if isinstance(candle, list):
            timestamp, open_p, high, low, close = candle
        else:
            timestamp = candle.get('timestamp')
            open_p = candle.get('open')
            high = candle.get('high')
            low = candle.get('low')
            close = candle.get('close')
        
        date = datetime.fromtimestamp(timestamp/1000).strftime('%Y-%m-%d %H:%M')
        print(f"{date:<20} ${open_p:>10,.0f} ${high:>10,.0f} ${low:>10,.0f} ${close:>10,.0f}")
    
    # Calculate statistics
    print("\n📊 Statistics:")
    if candles:
        if isinstance(candles[0], list):
            opens = [c[1] for c in candles]
            highs = [c[2] for c in candles]
            lows = [c[3] for c in candles]
            closes = [c[4] for c in candles]
        else:
            opens = [c.get('open', 0) for c in candles]
            highs = [c.get('high', 0) for c in candles]
            lows = [c.get('low', 0) for c in candles]
            closes = [c.get('close', 0) for c in candles]
        
        print(f"   Period High: ${max(highs):,.0f}")
        print(f"   Period Low: ${min(lows):,.0f}")
        print(f"   Price Change: ${closes[-1] - opens[0]:+,.0f}")
        print(f"   Volatility: ${max(highs) - min(lows):,.0f}")
    ```

=== "JavaScript"
    ```javascript
    async function getOHLC(coinId, days = 7, interval = null) {
        const params = new URLSearchParams({ days: days.toString() });
        if (interval) params.set('interval', interval);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/market/ohlc/${coinId}?${params}`
        );
        return response.json();
    }
    
    // Get Bitcoin OHLC
    const ohlc = await getOHLC('bitcoin', 7);
    
    console.log("📈 Bitcoin OHLC Data (7 Days)");
    console.log("=".repeat(80));
    
    const candles = ohlc.ohlc || ohlc;
    candles.slice(0, 10).forEach(candle => {
        let date, open, high, low, close;
        
        if (Array.isArray(candle)) {
            [date, open, high, low, close] = candle;
        } else {
            ({ timestamp: date, open, high, low, close } = candle);
        }
        
        const dateStr = new Date(date).toLocaleDateString();
        console.log(`${dateStr.padEnd(15)} O: $${open?.toFixed(0)} H: $${high?.toFixed(0)} L: $${low?.toFixed(0)} C: $${close?.toFixed(0)}`);
    });
    
    // Calculate stats
    if (candles.length > 0) {
        const highs = candles.map(c => Array.isArray(c) ? c[2] : c.high);
        const lows = candles.map(c => Array.isArray(c) ? c[3] : c.low);
        
        console.log("\n📊 Statistics:");
        console.log(`   Period High: $${Math.max(...highs).toLocaleString()}`);
        console.log(`   Period Low: $${Math.min(...lows).toLocaleString()}`);
    }
    ```

=== "cURL"
    ```bash
    # Get 7-day OHLC for Bitcoin
    curl "https://cryptocurrency.cv/api/market/ohlc/bitcoin?days=7" | jq
    
    # Get 30-day OHLC for Ethereum
    curl "https://cryptocurrency.cv/api/market/ohlc/ethereum?days=30" | jq
    
    # Get daily interval
    curl "https://cryptocurrency.cv/api/market/ohlc/bitcoin?days=30&interval=daily" | jq
    ```

---

## 3. Exchange Data

Get information about cryptocurrency exchanges.

=== "Python"
    ```python
    import requests
    
    def get_exchanges():
        """Get exchange data."""
        response = requests.get(
            "https://cryptocurrency.cv/api/market/exchanges"
        )
        return response.json()
    
    # Get all exchanges
    exchanges = get_exchanges()
    
    print("🏦 Cryptocurrency Exchanges")
    print("=" * 80)
    print(f"{'#':<4} {'Exchange':<20} {'Trust Score':<12} {'24h Volume':<15} {'Country':<15}")
    print("-" * 80)
    
    exchange_list = exchanges.get('exchanges', exchanges)
    for i, ex in enumerate(exchange_list[:20], 1):
        name = ex.get('name', 'Unknown')[:18]
        trust = ex.get('trust_score', 0)
        volume = ex.get('trade_volume_24h_btc', 0)
        country = ex.get('country', 'Unknown')[:13]
        
        # Trust score indicator
        if trust >= 8:
            trust_icon = "🟢"
        elif trust >= 5:
            trust_icon = "🟡"
        else:
            trust_icon = "🔴"
        
        volume_str = f"{volume:,.0f} BTC"
        
        print(f"{i:<4} {name:<20} {trust_icon} {trust:<10} {volume_str:<15} {country:<15}")
    
    # Top 5 by volume
    print("\n" + "=" * 80)
    print("🏆 Top 5 by Volume:")
    
    sorted_by_volume = sorted(
        exchange_list, 
        key=lambda x: x.get('trade_volume_24h_btc', 0), 
        reverse=True
    )
    
    for i, ex in enumerate(sorted_by_volume[:5], 1):
        volume = ex.get('trade_volume_24h_btc', 0)
        print(f"   {i}. {ex.get('name')}: {volume:,.0f} BTC")
    ```

=== "JavaScript"
    ```javascript
    async function getExchanges() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/market/exchanges'
        );
        return response.json();
    }
    
    // Get exchanges
    const exchanges = await getExchanges();
    
    console.log("🏦 Cryptocurrency Exchanges");
    console.log("=".repeat(80));
    
    const exchangeList = exchanges.exchanges || exchanges;
    exchangeList.slice(0, 20).forEach((ex, i) => {
        const trust = ex.trust_score || 0;
        const volume = ex.trade_volume_24h_btc || 0;
        const trustIcon = trust >= 8 ? '🟢' : trust >= 5 ? '🟡' : '🔴';
        
        console.log(`${(i+1).toString().padEnd(4)} ${ex.name?.slice(0,18).padEnd(20)} ${trustIcon} ${trust.toString().padEnd(10)} ${volume.toLocaleString()} BTC`);
    });
    
    // Top by volume
    console.log("\n🏆 Top 5 by Volume:");
    const sorted = [...exchangeList].sort((a, b) => 
        (b.trade_volume_24h_btc || 0) - (a.trade_volume_24h_btc || 0)
    );
    
    sorted.slice(0, 5).forEach((ex, i) => {
        console.log(`   ${i+1}. ${ex.name}: ${ex.trade_volume_24h_btc?.toLocaleString()} BTC`);
    });
    ```

=== "cURL"
    ```bash
    # Get all exchanges
    curl "https://cryptocurrency.cv/api/market/exchanges" | jq
    
    # Get top 10 exchanges
    curl "https://cryptocurrency.cv/api/market/exchanges" | jq '.exchanges[:10]'
    
    # Get exchange names and volumes
    curl "https://cryptocurrency.cv/api/market/exchanges" | jq '.exchanges[] | {name, volume: .trade_volume_24h_btc}'
    ```

---

## 4. Derivatives Market

Get derivatives market data including futures and perpetuals.

=== "Python"
    ```python
    import requests
    
    def get_derivatives():
        """Get derivatives market data."""
        response = requests.get(
            "https://cryptocurrency.cv/api/market/derivatives"
        )
        return response.json()
    
    # Get derivatives data
    derivatives = get_derivatives()
    
    print("📊 Derivatives Market")
    print("=" * 90)
    print(f"{'Exchange':<15} {'Symbol':<15} {'Price':<12} {'24h %':<10} {'Volume':<15} {'OI':<15}")
    print("-" * 90)
    
    deriv_list = derivatives.get('derivatives', derivatives)
    for d in deriv_list[:15]:
        exchange = d.get('market', 'Unknown')[:13]
        symbol = d.get('symbol', 'Unknown')[:13]
        price = d.get('price', 0)
        change = d.get('price_percentage_change_24h', 0)
        volume = d.get('volume_24h', 0)
        oi = d.get('open_interest', 0)
        
        # Format values
        price_str = f"${price:,.2f}" if price < 10000 else f"${price:,.0f}"
        change_str = f"{change:+.2f}%"
        vol_str = f"${volume/1e6:.1f}M" if volume >= 1e6 else f"${volume/1e3:.1f}K"
        oi_str = f"${oi/1e6:.1f}M" if oi >= 1e6 else f"${oi/1e3:.1f}K"
        
        indicator = "🟢" if change > 0 else "🔴" if change < 0 else "⚪"
        
        print(f"{exchange:<15} {symbol:<15} {price_str:<12} {indicator} {change_str:<8} {vol_str:<15} {oi_str:<15}")
    
    # Aggregate stats
    print("\n📈 Market Summary:")
    total_volume = sum(d.get('volume_24h', 0) for d in deriv_list)
    total_oi = sum(d.get('open_interest', 0) for d in deriv_list)
    print(f"   Total 24h Volume: ${total_volume/1e9:.2f}B")
    print(f"   Total Open Interest: ${total_oi/1e9:.2f}B")
    ```

=== "JavaScript"
    ```javascript
    async function getDerivatives() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/market/derivatives'
        );
        return response.json();
    }
    
    // Get derivatives data
    const derivatives = await getDerivatives();
    
    console.log("📊 Derivatives Market");
    console.log("=".repeat(90));
    
    const derivList = derivatives.derivatives || derivatives;
    derivList.slice(0, 15).forEach(d => {
        const change = d.price_percentage_change_24h || 0;
        const volume = d.volume_24h || 0;
        const oi = d.open_interest || 0;
        
        const indicator = change > 0 ? '🟢' : change < 0 ? '🔴' : '⚪';
        const volStr = volume >= 1e6 ? `$${(volume/1e6).toFixed(1)}M` : `$${(volume/1e3).toFixed(1)}K`;
        
        console.log(`${d.market?.slice(0,13).padEnd(15)} ${d.symbol?.slice(0,13).padEnd(15)} ${indicator} ${change.toFixed(2)}% ${volStr}`);
    });
    
    // Summary
    const totalVol = derivList.reduce((sum, d) => sum + (d.volume_24h || 0), 0);
    console.log(`\n📈 Total 24h Volume: $${(totalVol/1e9).toFixed(2)}B`);
    ```

=== "cURL"
    ```bash
    # Get derivatives data
    curl "https://cryptocurrency.cv/api/market/derivatives" | jq
    
    # Get top 10 by volume
    curl "https://cryptocurrency.cv/api/market/derivatives" | jq '.derivatives | sort_by(-.volume_24h)[:10]'
    ```

---

## 5. Market Categories

Explore different market categories and sectors.

=== "Python"
    ```python
    import requests
    
    def get_categories():
        """Get market categories."""
        response = requests.get(
            "https://cryptocurrency.cv/api/market/categories"
        )
        return response.json()
    
    # Get categories
    categories = get_categories()
    
    print("📁 Market Categories")
    print("=" * 80)
    
    cat_list = categories.get('categories', categories)
    
    # Top categories by market cap
    print("\n🏆 Top Categories by Market Cap:")
    sorted_by_mcap = sorted(cat_list, key=lambda x: x.get('market_cap', 0), reverse=True)
    
    for i, cat in enumerate(sorted_by_mcap[:10], 1):
        name = cat.get('name', 'Unknown')
        mcap = cat.get('market_cap', 0)
        change = cat.get('market_cap_change_24h', 0)
        coins = cat.get('coins_count', 0)
        
        mcap_str = f"${mcap/1e9:.1f}B" if mcap >= 1e9 else f"${mcap/1e6:.1f}M"
        indicator = "🟢" if change > 0 else "🔴" if change < 0 else "⚪"
        
        print(f"   {i:>2}. {name[:30]:<32} {mcap_str:>12} {indicator} {change:>+6.1f}% ({coins} coins)")
    
    # Top gainers
    print("\n📈 Top Gaining Categories:")
    sorted_by_change = sorted(cat_list, key=lambda x: x.get('market_cap_change_24h', 0), reverse=True)
    
    for cat in sorted_by_change[:5]:
        name = cat.get('name', 'Unknown')
        change = cat.get('market_cap_change_24h', 0)
        print(f"   🟢 {name[:40]}: {change:+.2f}%")
    
    # Top losers
    print("\n📉 Top Losing Categories:")
    for cat in sorted_by_change[-5:][::-1]:
        name = cat.get('name', 'Unknown')
        change = cat.get('market_cap_change_24h', 0)
        print(f"   🔴 {name[:40]}: {change:+.2f}%")
    ```

=== "JavaScript"
    ```javascript
    async function getCategories() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/market/categories'
        );
        return response.json();
    }
    
    // Get categories
    const categories = await getCategories();
    
    console.log("📁 Market Categories");
    console.log("=".repeat(80));
    
    const catList = categories.categories || categories;
    
    // Sort by market cap
    const sortedByMcap = [...catList].sort((a, b) => 
        (b.market_cap || 0) - (a.market_cap || 0)
    );
    
    console.log("\n🏆 Top Categories by Market Cap:");
    sortedByMcap.slice(0, 10).forEach((cat, i) => {
        const mcap = cat.market_cap || 0;
        const change = cat.market_cap_change_24h || 0;
        const mcapStr = mcap >= 1e9 ? `$${(mcap/1e9).toFixed(1)}B` : `$${(mcap/1e6).toFixed(1)}M`;
        const indicator = change > 0 ? '🟢' : change < 0 ? '🔴' : '⚪';
        
        console.log(`   ${(i+1).toString().padEnd(3)} ${cat.name?.slice(0,30).padEnd(32)} ${mcapStr.padStart(12)} ${indicator} ${change.toFixed(1)}%`);
    });
    
    // Top gainers
    const sortedByChange = [...catList].sort((a, b) => 
        (b.market_cap_change_24h || 0) - (a.market_cap_change_24h || 0)
    );
    
    console.log("\n📈 Top Gainers:");
    sortedByChange.slice(0, 5).forEach(cat => {
        console.log(`   🟢 ${cat.name}: ${(cat.market_cap_change_24h || 0).toFixed(2)}%`);
    });
    ```

=== "cURL"
    ```bash
    # Get all categories
    curl "https://cryptocurrency.cv/api/market/categories" | jq
    
    # Get top 10 by market cap
    curl "https://cryptocurrency.cv/api/market/categories" | jq '.categories | sort_by(-.market_cap)[:10]'
    
    # Get category names
    curl "https://cryptocurrency.cv/api/market/categories" | jq '.categories[].name'
    ```

---

## 6. Market Search

Search for coins, exchanges, and other market entities.

=== "Python"
    ```python
    import requests
    
    def search_market(query: str):
        """Search market data."""
        response = requests.get(
            "https://cryptocurrency.cv/api/market/search",
            params={"q": query}
        )
        return response.json()
    
    # Search examples
    queries = ["bitcoin", "defi", "layer 2", "meme"]
    
    for query in queries:
        print(f"\n🔍 Search: '{query}'")
        print("-" * 60)
        
        results = search_market(query)
        
        # Coins
        if 'coins' in results and results['coins']:
            print("  💰 Coins:")
            for coin in results['coins'][:5]:
                print(f"     {coin.get('name')} ({coin.get('symbol')})")
        
        # Exchanges
        if 'exchanges' in results and results['exchanges']:
            print("  🏦 Exchanges:")
            for ex in results['exchanges'][:3]:
                print(f"     {ex.get('name')}")
        
        # Categories
        if 'categories' in results and results['categories']:
            print("  📁 Categories:")
            for cat in results['categories'][:3]:
                print(f"     {cat.get('name')}")
    ```

=== "JavaScript"
    ```javascript
    async function searchMarket(query) {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(
            `https://cryptocurrency.cv/api/market/search?${params}`
        );
        return response.json();
    }
    
    // Search examples
    const queries = ['bitcoin', 'defi', 'layer 2', 'meme'];
    
    for (const query of queries) {
        console.log(`\n🔍 Search: '${query}'`);
        console.log("-".repeat(60));
        
        const results = await searchMarket(query);
        
        if (results.coins?.length) {
            console.log("  💰 Coins:");
            results.coins.slice(0, 5).forEach(coin => {
                console.log(`     ${coin.name} (${coin.symbol})`);
            });
        }
        
        if (results.exchanges?.length) {
            console.log("  🏦 Exchanges:");
            results.exchanges.slice(0, 3).forEach(ex => {
                console.log(`     ${ex.name}`);
            });
        }
    }
    ```

=== "cURL"
    ```bash
    # Search for "bitcoin"
    curl "https://cryptocurrency.cv/api/market/search?q=bitcoin" | jq
    
    # Search for "defi"
    curl "https://cryptocurrency.cv/api/market/search?q=defi" | jq '.coins[:5]'
    ```

---

## 7. Fear & Greed Index

Get the crypto Fear & Greed Index.

=== "Python"
    ```python
    import requests
    
    def get_fear_greed(days: int = 7):
        """Get Fear & Greed Index."""
        response = requests.get(
            "https://cryptocurrency.cv/api/fear-greed",
            params={"days": days}
        )
        return response.json()
    
    # Get Fear & Greed data
    data = get_fear_greed(days=30)
    
    print("😱 Crypto Fear & Greed Index")
    print("=" * 60)
    
    current = data.get('value', 0)
    classification = data.get('classification', 'Unknown')
    
    # Visual representation
    bar_filled = int(current / 5)  # 20 segments
    bar = "█" * bar_filled + "░" * (20 - bar_filled)
    
    # Color based on value
    if current <= 25:
        emoji = "😱"
        mood = "Extreme Fear"
    elif current <= 45:
        emoji = "😰"
        mood = "Fear"
    elif current <= 55:
        emoji = "😐"
        mood = "Neutral"
    elif current <= 75:
        emoji = "😊"
        mood = "Greed"
    else:
        emoji = "🤑"
        mood = "Extreme Greed"
    
    print(f"\n   Current Value: {current}/100")
    print(f"   Classification: {classification} {emoji}")
    print(f"\n   Fear [{bar}] Greed")
    print(f"   0                           100")
    
    # Historical data
    if 'history' in data:
        print("\n📈 Historical Data:")
        for entry in data['history'][:7]:
            val = entry.get('value', 0)
            date = entry.get('date', 'Unknown')
            hist_bar = "█" * int(val / 10) + "░" * (10 - int(val / 10))
            print(f"   {date}: [{hist_bar}] {val}")
    
    # Components
    if 'components' in data:
        print("\n📊 Index Components:")
        for component, value in data['components'].items():
            print(f"   {component}: {value}")
    ```

=== "JavaScript"
    ```javascript
    async function getFearGreed(days = 7) {
        const params = new URLSearchParams({ days: days.toString() });
        const response = await fetch(
            `https://cryptocurrency.cv/api/fear-greed?${params}`
        );
        return response.json();
    }
    
    // Get Fear & Greed data
    const data = await getFearGreed(30);
    
    console.log("😱 Crypto Fear & Greed Index");
    console.log("=".repeat(60));
    
    const current = data.value || 0;
    
    // Visual representation
    const barFilled = Math.floor(current / 5);
    const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);
    
    // Emoji based on value
    let emoji;
    if (current <= 25) emoji = "😱";
    else if (current <= 45) emoji = "😰";
    else if (current <= 55) emoji = "😐";
    else if (current <= 75) emoji = "😊";
    else emoji = "🤑";
    
    console.log(`\n   Current Value: ${current}/100`);
    console.log(`   Classification: ${data.classification} ${emoji}`);
    console.log(`\n   Fear [${bar}] Greed`);
    
    // Historical
    if (data.history) {
        console.log("\n📈 Historical Data:");
        data.history.slice(0, 7).forEach(entry => {
            const val = entry.value || 0;
            const histBar = "█".repeat(Math.floor(val / 10)) + "░".repeat(10 - Math.floor(val / 10));
            console.log(`   ${entry.date}: [${histBar}] ${val}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get current Fear & Greed
    curl "https://cryptocurrency.cv/api/fear-greed" | jq
    
    # Get 30-day history
    curl "https://cryptocurrency.cv/api/fear-greed?days=30" | jq
    
    # Get just the value
    curl "https://cryptocurrency.cv/api/fear-greed" | jq '{value, classification}'
    ```

---

## Complete Market Dashboard

Build a comprehensive market dashboard:

```python
#!/usr/bin/env python3
"""Complete crypto market dashboard."""

import requests
from datetime import datetime

class MarketDashboard:
    """Crypto market dashboard."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: dict = None):
        response = self.session.get(f"{self.BASE_URL}{endpoint}", params=params or {})
        return response.json()
    
    def run_dashboard(self):
        """Display complete market dashboard."""
        print("=" * 80)
        print("📊 CRYPTO MARKET DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Fear & Greed
        print("\n😱 MARKET SENTIMENT")
        print("-" * 80)
        try:
            fg = self._get("/api/fear-greed")
            val = fg.get('value', 0)
            bar = "█" * (val // 5) + "░" * (20 - val // 5)
            print(f"   Fear & Greed: [{bar}] {val}/100 - {fg.get('classification')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Top Coins
        print("\n💰 TOP COINS")
        print("-" * 80)
        try:
            coins = self._get("/api/market/coins", {"per_page": 10})
            coin_list = coins.get('coins', coins)
            for coin in coin_list[:10]:
                price = coin.get('current_price', 0)
                change = coin.get('price_change_percentage_24h', 0)
                ind = "🟢" if change > 0 else "🔴"
                print(f"   {coin.get('symbol', '').upper():<6} ${price:>12,.2f} {ind} {change:>+7.2f}%")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Top Categories
        print("\n📁 TOP CATEGORIES")
        print("-" * 80)
        try:
            cats = self._get("/api/market/categories")
            cat_list = sorted(cats.get('categories', cats), 
                            key=lambda x: x.get('market_cap', 0), reverse=True)
            for cat in cat_list[:5]:
                mcap = cat.get('market_cap', 0)
                change = cat.get('market_cap_change_24h', 0)
                ind = "🟢" if change > 0 else "🔴"
                print(f"   {cat.get('name', '')[:30]:<32} ${mcap/1e9:>8.1f}B {ind} {change:>+6.1f}%")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Top Exchanges
        print("\n🏦 TOP EXCHANGES")
        print("-" * 80)
        try:
            exchanges = self._get("/api/market/exchanges")
            ex_list = exchanges.get('exchanges', exchanges)
            for ex in ex_list[:5]:
                vol = ex.get('trade_volume_24h_btc', 0)
                trust = ex.get('trust_score', 0)
                print(f"   {ex.get('name', '')[:20]:<22} Trust: {trust}/10  Volume: {vol:>12,.0f} BTC")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    dashboard = MarketDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [Trading Signals Tutorial](trading-signals.md) - Get trading signals
- [Real-time Streaming](realtime-sse.md) - Subscribe to live updates
- [Analytics Tutorial](analytics-research.md) - Deep market analysis
