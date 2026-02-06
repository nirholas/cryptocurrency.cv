# 📊 Trading & Market APIs Tutorial

Access real-time trading signals, arbitrage opportunities, and market intelligence.

---

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `GET /api/arbitrage` | Cross-exchange arbitrage |
| `GET /api/signals` | AI trading signals |
| `GET /api/funding` | Perpetual funding rates |
| `GET /api/options` | Options flow data |
| `GET /api/liquidations` | Liquidation events |
| `GET /api/whale-alerts` | Whale transactions |
| `GET /api/orderbook` | Aggregated order book |
| `GET /api/fear-greed` | Fear & Greed Index |

---

## Arbitrage Opportunities

Find price discrepancies across exchanges.

=== "Python"

    ```python
    import requests
    from typing import Optional, List
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def get_arbitrage(
        pairs: Optional[List[str]] = None,
        min_spread: float = 0.5,
        exchanges: Optional[List[str]] = None
    ) -> dict:
        """
        Find arbitrage opportunities across exchanges.
        
        Args:
            pairs: Trading pairs to check (e.g., ["BTCUSDT", "ETHUSDT"])
            min_spread: Minimum spread percentage to show
            exchanges: Filter by exchanges
        
        Returns:
            Arbitrage opportunities with buy/sell details
        """
        params = {"minSpread": min_spread}
        
        if pairs:
            params["pairs"] = ",".join(pairs)
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        
        response = requests.get(f"{BASE_URL}/api/arbitrage", params=params)
        return response.json()
    
    
    # Find arbitrage opportunities
    arb = get_arbitrage(min_spread=0.3)
    
    print("💰 ARBITRAGE OPPORTUNITIES")
    print("=" * 70)
    print(f"Scan time: {arb.get('scanTime', 'N/A')}")
    print("-" * 70)
    
    opportunities = arb.get("opportunities", [])
    
    if not opportunities:
        print("No arbitrage opportunities found above threshold.")
    else:
        print(f"{'Pair':<12} {'Buy On':<12} {'Sell On':<12} {'Spread':>8} {'Profit':>10}")
        print("-" * 70)
        
        for opp in opportunities[:10]:
            pair = opp.get("pair", "N/A")
            buy_exchange = opp.get("buyExchange", "N/A")
            sell_exchange = opp.get("sellExchange", "N/A")
            spread = opp.get("spread", 0)
            buy_price = opp.get("buyPrice", 0)
            sell_price = opp.get("sellPrice", 0)
            
            profit = (spread / 100) * 10000  # Profit on $10k
            
            print(f"{pair:<12} {buy_exchange:<12} {sell_exchange:<12} "
                  f"{spread:>7.2f}% ${profit:>8.2f}")
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    async function getArbitrage(options = {}) {
        const { pairs, minSpread = 0.5, exchanges } = options;
        
        const params = new URLSearchParams({ minSpread: minSpread.toString() });
        if (pairs) params.set("pairs", pairs.join(","));
        if (exchanges) params.set("exchanges", exchanges.join(","));
        
        const response = await fetch(`${BASE_URL}/api/arbitrage?${params}`);
        return response.json();
    }
    
    // Example
    const arb = await getArbitrage({ minSpread: 0.3 });
    
    console.log("💰 ARBITRAGE OPPORTUNITIES");
    console.log(`Scan time: ${arb.scanTime}`);
    
    arb.opportunities?.slice(0, 10).forEach(opp => {
        console.log(`${opp.pair}: Buy on ${opp.buyExchange}, Sell on ${opp.sellExchange} (${opp.spread.toFixed(2)}%)`);
    });
    ```

=== "cURL"

    ```bash
    # Find all opportunities > 0.5% spread
    curl "https://cryptocurrency.cv/api/arbitrage?minSpread=0.5"
    
    # Specific pairs
    curl "https://cryptocurrency.cv/api/arbitrage?pairs=BTCUSDT,ETHUSDT&minSpread=0.3"
    
    # Filter exchanges
    curl "https://cryptocurrency.cv/api/arbitrage?exchanges=binance,coinbase,kraken"
    ```

---

## AI Trading Signals

Get AI-powered trading signals with confidence scores.

=== "Python"

    ```python
    def get_signals(
        asset: Optional[str] = None,
        timeframe: str = "1h"
    ) -> dict:
        """
        Get AI trading signals.
        
        Args:
            asset: Filter by asset (BTC, ETH, etc.)
            timeframe: Signal timeframe (1h, 4h, 1d)
        
        Returns:
            Trading signals with targets and stop losses
        """
        params = {"timeframe": timeframe}
        if asset:
            params["asset"] = asset
        
        response = requests.get(f"{BASE_URL}/api/signals", params=params)
        return response.json()
    
    
    # Get Bitcoin signals
    signals = get_signals(asset="BTC", timeframe="4h")
    
    print("📡 AI TRADING SIGNALS - BTC 4H")
    print("=" * 60)
    
    signal = signals.get("signal", {}) if isinstance(signals, dict) else signals
    
    if isinstance(signal, dict):
        direction = signal.get("signal", signal.get("direction", "N/A"))
        confidence = signal.get("confidence", 0)
        entry = signal.get("entry", signal.get("currentPrice", 0))
        target = signal.get("priceTarget", signal.get("target", 0))
        stop_loss = signal.get("stopLoss", 0)
        
        emoji = "🟢" if direction.lower() in ["long", "buy", "bullish"] else \
                "🔴" if direction.lower() in ["short", "sell", "bearish"] else "⚪"
        
        print(f"\n{emoji} Signal: {direction.upper()}")
        print(f"   Confidence: {confidence * 100:.1f}%")
        print(f"   Entry: ${entry:,.2f}")
        print(f"   Target: ${target:,.2f}")
        print(f"   Stop Loss: ${stop_loss:,.2f}")
        
        # Risk/Reward ratio
        if entry and target and stop_loss:
            reward = abs(target - entry)
            risk = abs(entry - stop_loss)
            rr = reward / risk if risk > 0 else 0
            print(f"   R/R Ratio: {rr:.2f}:1")
        
        # Factors
        factors = signal.get("factors", [])
        if factors:
            print(f"\n📊 Contributing Factors:")
            for factor in factors:
                name = factor.get("name", factor) if isinstance(factor, dict) else factor
                weight = factor.get("weight", "") if isinstance(factor, dict) else ""
                print(f"   • {name} {f'({weight})' if weight else ''}")
    ```

=== "JavaScript"

    ```javascript
    async function getSignals(asset, timeframe = "1h") {
        const params = new URLSearchParams({ timeframe });
        if (asset) params.set("asset", asset);
        
        const response = await fetch(`${BASE_URL}/api/signals?${params}`);
        return response.json();
    }
    
    // Get BTC 4-hour signals
    const signals = await getSignals("BTC", "4h");
    
    console.log("📡 AI TRADING SIGNALS - BTC 4H");
    console.log("=".repeat(60));
    
    const signal = signals.signal || signals;
    const direction = signal.signal || signal.direction;
    const emoji = ["long", "buy", "bullish"].includes(direction?.toLowerCase()) ? "🟢" : 
                  ["short", "sell", "bearish"].includes(direction?.toLowerCase()) ? "🔴" : "⚪";
    
    console.log(`${emoji} Signal: ${direction?.toUpperCase()}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    console.log(`   Entry: $${signal.entry?.toLocaleString()}`);
    console.log(`   Target: $${signal.priceTarget?.toLocaleString()}`);
    console.log(`   Stop Loss: $${signal.stopLoss?.toLocaleString()}`);
    ```

=== "cURL"

    ```bash
    # BTC signals on 1-hour timeframe
    curl "https://cryptocurrency.cv/api/signals?asset=BTC&timeframe=1h"
    
    # ETH daily signals
    curl "https://cryptocurrency.cv/api/signals?asset=ETH&timeframe=1d"
    
    # All assets, 4-hour
    curl "https://cryptocurrency.cv/api/signals?timeframe=4h"
    ```

---

## Perpetual Funding Rates

Track funding rates across exchanges.

=== "Python"

    ```python
    def get_funding_rates(
        symbol: Optional[str] = None,
        exchanges: Optional[List[str]] = None
    ) -> dict:
        """
        Get perpetual funding rates.
        
        Args:
            symbol: Trading pair symbol
            exchanges: Filter by exchanges
        
        Returns:
            Funding rates with sentiment indicators
        """
        params = {}
        if symbol:
            params["symbol"] = symbol
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        
        response = requests.get(f"{BASE_URL}/api/funding", params=params)
        return response.json()
    
    
    # Get funding rates
    funding = get_funding_rates()
    
    print("📊 PERPETUAL FUNDING RATES")
    print("=" * 70)
    
    avg_rate = funding.get("avgFundingRate", 0)
    sentiment = funding.get("sentiment", "neutral")
    
    print(f"Average Funding Rate: {avg_rate:.4%}")
    print(f"Market Sentiment: {sentiment.upper()}")
    print("-" * 70)
    
    print(f"{'Symbol':<12} {'Exchange':<12} {'Rate':>10} {'Annual':>10}")
    print("-" * 70)
    
    for rate in funding.get("rates", [])[:15]:
        symbol = rate.get("symbol", "N/A")
        exchange = rate.get("exchange", "N/A")
        rate_val = rate.get("rate", 0)
        annual = rate_val * 3 * 365  # Annualized (8h funding)
        
        emoji = "🟢" if rate_val > 0 else "🔴" if rate_val < 0 else "⚪"
        print(f"{emoji} {symbol:<10} {exchange:<12} {rate_val:>+9.4%} {annual:>+9.2%}")
    ```

=== "JavaScript"

    ```javascript
    async function getFundingRates(symbol, exchanges) {
        const params = new URLSearchParams();
        if (symbol) params.set("symbol", symbol);
        if (exchanges) params.set("exchanges", exchanges.join(","));
        
        const response = await fetch(`${BASE_URL}/api/funding?${params}`);
        return response.json();
    }
    
    const funding = await getFundingRates();
    
    console.log("📊 PERPETUAL FUNDING RATES");
    console.log(`Average: ${(funding.avgFundingRate * 100).toFixed(4)}%`);
    console.log(`Sentiment: ${funding.sentiment}`);
    
    funding.rates?.slice(0, 10).forEach(rate => {
        const emoji = rate.rate > 0 ? "🟢" : rate.rate < 0 ? "🔴" : "⚪";
        console.log(`${emoji} ${rate.symbol}: ${(rate.rate * 100).toFixed(4)}%`);
    });
    ```

=== "cURL"

    ```bash
    # All funding rates
    curl "https://cryptocurrency.cv/api/funding"
    
    # Specific symbol
    curl "https://cryptocurrency.cv/api/funding?symbol=BTCUSDT"
    
    # Specific exchanges
    curl "https://cryptocurrency.cv/api/funding?exchanges=binance,bybit"
    ```

---

## Options Flow

Track options market activity and flows.

=== "Python"

    ```python
    def get_options_flow(
        asset: str = "BTC",
        exchange: Optional[str] = None,
        option_type: Optional[str] = None
    ) -> dict:
        """
        Get options flow data.
        
        Args:
            asset: Asset symbol (BTC, ETH)
            exchange: Filter by exchange
            option_type: Filter by type (call, put)
        
        Returns:
            Options flows with put/call ratio and max pain
        """
        params = {"asset": asset}
        if exchange:
            params["exchange"] = exchange
        if option_type:
            params["type"] = option_type
        
        response = requests.get(f"{BASE_URL}/api/options", params=params)
        return response.json()
    
    
    # Get BTC options flow
    options = get_options_flow(asset="BTC")
    
    print("📈 OPTIONS FLOW - BTC")
    print("=" * 60)
    
    pcr = options.get("putCallRatio", 0)
    max_pain = options.get("maxPain", 0)
    total_volume = options.get("totalVolume", 0)
    
    print(f"Put/Call Ratio: {pcr:.2f}")
    print(f"Max Pain: ${max_pain:,.0f}")
    print(f"Total Volume: ${total_volume:,.0f}")
    
    # Sentiment interpretation
    if pcr < 0.7:
        print("📊 Interpretation: Bullish (more calls than puts)")
    elif pcr > 1.3:
        print("📊 Interpretation: Bearish (more puts than calls)")
    else:
        print("📊 Interpretation: Neutral")
    
    print("-" * 60)
    print("\n📋 Recent Large Flows:")
    
    for flow in options.get("flows", [])[:10]:
        direction = flow.get("type", "N/A")
        strike = flow.get("strike", 0)
        expiry = flow.get("expiry", "N/A")
        premium = flow.get("premium", 0)
        
        emoji = "🟢" if direction.lower() == "call" else "🔴"
        print(f"   {emoji} {direction.upper()} ${strike:,.0f} | {expiry} | Premium: ${premium:,.0f}")
    ```

=== "JavaScript"

    ```javascript
    async function getOptionsFlow(asset = "BTC", exchange, optionType) {
        const params = new URLSearchParams({ asset });
        if (exchange) params.set("exchange", exchange);
        if (optionType) params.set("type", optionType);
        
        const response = await fetch(`${BASE_URL}/api/options?${params}`);
        return response.json();
    }
    
    const options = await getOptionsFlow("BTC");
    
    console.log("📈 OPTIONS FLOW - BTC");
    console.log(`Put/Call Ratio: ${options.putCallRatio?.toFixed(2)}`);
    console.log(`Max Pain: $${options.maxPain?.toLocaleString()}`);
    console.log(`Total Volume: $${options.totalVolume?.toLocaleString()}`);
    ```

=== "cURL"

    ```bash
    # BTC options flow
    curl "https://cryptocurrency.cv/api/options?asset=BTC"
    
    # ETH calls only
    curl "https://cryptocurrency.cv/api/options?asset=ETH&type=call"
    ```

---

## Liquidation Data

Track market liquidations in real-time.

=== "Python"

    ```python
    def get_liquidations(
        symbol: Optional[str] = None,
        side: Optional[str] = None,
        min_value: int = 100000,
        period: str = "24h"
    ) -> dict:
        """
        Get liquidation data.
        
        Args:
            symbol: Filter by symbol
            side: Filter by side (long, short)
            min_value: Minimum liquidation value in USD
            period: Time period (1h, 4h, 24h)
        
        Returns:
            Liquidation events and summary
        """
        params = {"minValue": min_value, "period": period}
        if symbol:
            params["symbol"] = symbol
        if side:
            params["side"] = side
        
        response = requests.get(f"{BASE_URL}/api/liquidations", params=params)
        return response.json()
    
    
    # Get liquidations
    liqs = get_liquidations(min_value=500000, period="24h")
    
    print("💥 LIQUIDATIONS (24H)")
    print("=" * 70)
    
    summary = liqs.get("summary", {})
    print(f"Total Liquidated: ${summary.get('totalValue', 0):,.0f}")
    print(f"Long Liquidations: ${summary.get('longValue', 0):,.0f}")
    print(f"Short Liquidations: ${summary.get('shortValue', 0):,.0f}")
    
    ratio = summary.get('longValue', 0) / max(summary.get('shortValue', 1), 1)
    sentiment = "More longs liquidated (bearish pressure)" if ratio > 1.5 else \
                "More shorts liquidated (bullish pressure)" if ratio < 0.67 else "Balanced"
    print(f"\n📊 {sentiment}")
    
    print("-" * 70)
    print("\n🔥 Largest Liquidations:")
    print(f"{'Symbol':<12} {'Side':<8} {'Value':>15} {'Price':>12} {'Exchange':<12}")
    print("-" * 70)
    
    for liq in liqs.get("liquidations", [])[:10]:
        symbol = liq.get("symbol", "N/A")
        side = liq.get("side", "N/A")
        value = liq.get("value", 0)
        price = liq.get("price", 0)
        exchange = liq.get("exchange", "N/A")
        
        emoji = "🔴" if side.lower() == "long" else "🟢"
        print(f"{emoji} {symbol:<10} {side:<8} ${value:>14,.0f} ${price:>11,.2f} {exchange:<12}")
    ```

=== "JavaScript"

    ```javascript
    async function getLiquidations(options = {}) {
        const { symbol, side, minValue = 100000, period = "24h" } = options;
        
        const params = new URLSearchParams({ minValue: minValue.toString(), period });
        if (symbol) params.set("symbol", symbol);
        if (side) params.set("side", side);
        
        const response = await fetch(`${BASE_URL}/api/liquidations?${params}`);
        return response.json();
    }
    
    const liqs = await getLiquidations({ minValue: 500000, period: "24h" });
    
    console.log("💥 LIQUIDATIONS (24H)");
    console.log(`Total: $${liqs.summary?.totalValue?.toLocaleString()}`);
    console.log(`Longs: $${liqs.summary?.longValue?.toLocaleString()}`);
    console.log(`Shorts: $${liqs.summary?.shortValue?.toLocaleString()}`);
    
    liqs.liquidations?.slice(0, 10).forEach(liq => {
        const emoji = liq.side === "long" ? "🔴" : "🟢";
        console.log(`${emoji} ${liq.symbol}: $${liq.value?.toLocaleString()}`);
    });
    ```

=== "cURL"

    ```bash
    # All liquidations > $500k
    curl "https://cryptocurrency.cv/api/liquidations?minValue=500000"
    
    # BTC only
    curl "https://cryptocurrency.cv/api/liquidations?symbol=BTCUSDT"
    
    # Long liquidations only
    curl "https://cryptocurrency.cv/api/liquidations?side=long"
    ```

---

## Whale Alerts

Track large blockchain transactions.

=== "Python"

    ```python
    def get_whale_alerts(
        asset: Optional[str] = None,
        min_value: int = 1000000,
        alert_type: Optional[str] = None
    ) -> dict:
        """
        Get whale transaction alerts.
        
        Args:
            asset: Filter by asset
            min_value: Minimum value in USD
            alert_type: Type (transfer, exchange_inflow, exchange_outflow)
        
        Returns:
            Whale alerts with flow analysis
        """
        params = {"minValue": min_value}
        if asset:
            params["asset"] = asset
        if alert_type:
            params["type"] = alert_type
        
        response = requests.get(f"{BASE_URL}/api/whale-alerts", params=params)
        return response.json()
    
    
    # Get whale alerts
    whales = get_whale_alerts(min_value=5000000)
    
    print("🐋 WHALE ALERTS (>$5M)")
    print("=" * 70)
    
    # Hourly flow summary
    flow = whales.get("hourlyFlow", {})
    inflow = flow.get("exchangeInflow", 0)
    outflow = flow.get("exchangeOutflow", 0)
    net = outflow - inflow
    
    print(f"Exchange Inflow:  ${inflow:>15,.0f}")
    print(f"Exchange Outflow: ${outflow:>15,.0f}")
    print(f"Net Flow:         ${net:>+15,.0f}")
    
    sentiment = "Bullish (accumulation)" if net > 0 else "Bearish (distribution)"
    print(f"\n📊 {sentiment}")
    
    print("-" * 70)
    print("\n🔔 Recent Alerts:")
    
    for alert in whales.get("alerts", [])[:10]:
        asset = alert.get("asset", "N/A")
        amount = alert.get("amount", 0)
        value = alert.get("value", 0)
        from_addr = alert.get("from", "Unknown")[:15]
        to_addr = alert.get("to", "Unknown")[:15]
        alert_type = alert.get("type", "transfer")
        
        if "exchange" in to_addr.lower() or alert_type == "exchange_inflow":
            emoji = "🔴"  # Going to exchange (sell pressure)
        elif "exchange" in from_addr.lower() or alert_type == "exchange_outflow":
            emoji = "🟢"  # Leaving exchange (accumulation)
        else:
            emoji = "⚪"
        
        print(f"{emoji} {asset} | {amount:,.2f} | ${value:,.0f}")
        print(f"   {from_addr}... → {to_addr}...")
    ```

=== "JavaScript"

    ```javascript
    async function getWhaleAlerts(options = {}) {
        const { asset, minValue = 1000000, type } = options;
        
        const params = new URLSearchParams({ minValue: minValue.toString() });
        if (asset) params.set("asset", asset);
        if (type) params.set("type", type);
        
        const response = await fetch(`${BASE_URL}/api/whale-alerts?${params}`);
        return response.json();
    }
    
    const whales = await getWhaleAlerts({ minValue: 5000000 });
    
    console.log("🐋 WHALE ALERTS");
    
    const { hourlyFlow } = whales;
    console.log(`Exchange Inflow:  $${hourlyFlow?.exchangeInflow?.toLocaleString()}`);
    console.log(`Exchange Outflow: $${hourlyFlow?.exchangeOutflow?.toLocaleString()}`);
    
    whales.alerts?.slice(0, 10).forEach(alert => {
        console.log(`${alert.asset}: ${alert.amount?.toLocaleString()} ($${alert.value?.toLocaleString()})`);
    });
    ```

=== "cURL"

    ```bash
    # Whale alerts > $5M
    curl "https://cryptocurrency.cv/api/whale-alerts?minValue=5000000"
    
    # BTC whales
    curl "https://cryptocurrency.cv/api/whale-alerts?asset=BTC"
    
    # Exchange outflows only
    curl "https://cryptocurrency.cv/api/whale-alerts?type=exchange_outflow"
    ```

---

## Order Book Depth

Get aggregated order book data.

=== "Python"

    ```python
    def get_orderbook(
        symbol: str = "BTCUSDT",
        depth: int = 20,
        exchanges: Optional[List[str]] = None
    ) -> dict:
        """
        Get aggregated order book.
        
        Args:
            symbol: Trading pair
            depth: Order book depth
            exchanges: Exchanges to aggregate
        
        Returns:
            Order book with bids, asks, and analysis
        """
        params = {"symbol": symbol, "depth": depth}
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        
        response = requests.get(f"{BASE_URL}/api/orderbook", params=params)
        return response.json()
    
    
    # Get BTC/USDT order book
    ob = get_orderbook(symbol="BTCUSDT", depth=10)
    
    print(f"📚 ORDER BOOK - {ob.get('symbol', 'BTCUSDT')}")
    print("=" * 60)
    
    spread = ob.get("spread", 0)
    spread_pct = ob.get("spreadPercent", 0)
    imbalance = ob.get("imbalance", 0)
    
    print(f"Spread: ${spread:.2f} ({spread_pct:.4f}%)")
    print(f"Imbalance: {imbalance:+.2%} {'(bid heavy)' if imbalance > 0 else '(ask heavy)'}")
    print("-" * 60)
    
    # Display order book
    asks = ob.get("asks", [])[:10]
    bids = ob.get("bids", [])[:10]
    
    print(f"\n{'Bid Size':>15} {'Bid Price':>12} | {'Ask Price':<12} {'Ask Size':<15}")
    print("-" * 60)
    
    for i in range(max(len(asks), len(bids))):
        bid = bids[i] if i < len(bids) else [0, 0]
        ask = asks[i] if i < len(asks) else [0, 0]
        
        bid_price = bid[0] if isinstance(bid, list) else bid.get("price", 0)
        bid_size = bid[1] if isinstance(bid, list) else bid.get("size", 0)
        ask_price = ask[0] if isinstance(ask, list) else ask.get("price", 0)
        ask_size = ask[1] if isinstance(ask, list) else ask.get("size", 0)
        
        print(f"{bid_size:>15.4f} {bid_price:>12,.2f} | {ask_price:<12,.2f} {ask_size:<15.4f}")
    ```

=== "JavaScript"

    ```javascript
    async function getOrderbook(symbol = "BTCUSDT", depth = 20, exchanges) {
        const params = new URLSearchParams({ symbol, depth: depth.toString() });
        if (exchanges) params.set("exchanges", exchanges.join(","));
        
        const response = await fetch(`${BASE_URL}/api/orderbook?${params}`);
        return response.json();
    }
    
    const ob = await getOrderbook("BTCUSDT", 10);
    
    console.log(`📚 ORDER BOOK - ${ob.symbol}`);
    console.log(`Spread: $${ob.spread?.toFixed(2)} (${ob.spreadPercent?.toFixed(4)}%)`);
    console.log(`Imbalance: ${(ob.imbalance * 100)?.toFixed(2)}%`);
    ```

=== "cURL"

    ```bash
    # BTC/USDT order book
    curl "https://cryptocurrency.cv/api/orderbook?symbol=BTCUSDT&depth=20"
    
    # ETH order book from specific exchanges
    curl "https://cryptocurrency.cv/api/orderbook?symbol=ETHUSDT&exchanges=binance,coinbase"
    ```

---

## Complete Trading Dashboard

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete Trading Dashboard
    Aggregates all trading intelligence.
    """
    
    import requests
    from datetime import datetime
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def main():
        print("=" * 70)
        print("📊 TRADING INTELLIGENCE DASHBOARD")
        print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print("=" * 70)
        
        # 1. Fear & Greed
        print("\n😨 MARKET SENTIMENT")
        print("-" * 70)
        fg = requests.get(f"{BASE_URL}/api/fear-greed").json()
        value = fg.get("value", 50)
        classification = fg.get("classification", "Unknown")
        bar = "█" * int(value/2) + "░" * (50 - int(value/2))
        print(f"   Fear & Greed: {value}/100 - {classification}")
        print(f"   [Fear] {bar} [Greed]")
        
        # 2. Trading Signals
        print("\n📡 AI TRADING SIGNALS")
        print("-" * 70)
        for asset in ["BTC", "ETH"]:
            signals = requests.get(
                f"{BASE_URL}/api/signals",
                params={"asset": asset, "timeframe": "4h"}
            ).json()
            signal = signals.get("signal", signals)
            direction = signal.get("signal", signal.get("direction", "N/A"))
            confidence = signal.get("confidence", 0)
            emoji = "🟢" if "long" in str(direction).lower() or "buy" in str(direction).lower() else \
                    "🔴" if "short" in str(direction).lower() or "sell" in str(direction).lower() else "⚪"
            print(f"   {emoji} {asset}: {direction} ({confidence*100:.0f}% confidence)")
        
        # 3. Funding Rates
        print("\n💹 FUNDING RATES")
        print("-" * 70)
        funding = requests.get(f"{BASE_URL}/api/funding").json()
        for rate in funding.get("rates", [])[:5]:
            symbol = rate.get("symbol", "N/A")
            rate_val = rate.get("rate", 0)
            emoji = "🟢" if rate_val > 0 else "🔴" if rate_val < 0 else "⚪"
            print(f"   {emoji} {symbol}: {rate_val:+.4%}")
        
        # 4. Liquidations
        print("\n💥 LIQUIDATIONS (24H)")
        print("-" * 70)
        liqs = requests.get(
            f"{BASE_URL}/api/liquidations",
            params={"period": "24h"}
        ).json()
        summary = liqs.get("summary", {})
        print(f"   Total: ${summary.get('totalValue', 0):,.0f}")
        print(f"   Longs: ${summary.get('longValue', 0):,.0f} | "
              f"Shorts: ${summary.get('shortValue', 0):,.0f}")
        
        # 5. Whale Activity
        print("\n🐋 WHALE ACTIVITY")
        print("-" * 70)
        whales = requests.get(
            f"{BASE_URL}/api/whale-alerts",
            params={"minValue": 5000000}
        ).json()
        flow = whales.get("hourlyFlow", {})
        net = flow.get("exchangeOutflow", 0) - flow.get("exchangeInflow", 0)
        sentiment = "🟢 Accumulation" if net > 0 else "🔴 Distribution"
        print(f"   Net Exchange Flow: ${net:+,.0f}")
        print(f"   Signal: {sentiment}")
        
        # 6. Arbitrage
        print("\n💰 ARBITRAGE OPPORTUNITIES")
        print("-" * 70)
        arb = requests.get(
            f"{BASE_URL}/api/arbitrage",
            params={"minSpread": 0.3}
        ).json()
        opportunities = arb.get("opportunities", [])[:3]
        if opportunities:
            for opp in opportunities:
                print(f"   • {opp.get('pair')}: {opp.get('spread', 0):.2f}% "
                      f"({opp.get('buyExchange')} → {opp.get('sellExchange')})")
        else:
            print("   No significant opportunities found")
        
        print("\n" + "=" * 70)
        print("✅ Dashboard complete!")
    
    
    if __name__ == "__main__":
        main()
    ```

---

## Next Steps

- [Market Data APIs](market-coins.md) - Coin prices and market data
- [OHLC & Charts](market-ohlc.md) - Candlestick data for charts
- [Premium Signals](premium-signals.md) - Advanced AI signals
