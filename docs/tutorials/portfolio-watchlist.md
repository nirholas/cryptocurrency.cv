# Portfolio & Watchlist Tutorial

This tutorial covers user portfolio and watchlist endpoints for tracking personal investments and monitoring assets.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/portfolio` | Get portfolio overview |
| `/api/portfolio/holdings` | Portfolio holdings |
| `/api/portfolio/transactions` | Transaction history |
| `/api/portfolio/performance` | Performance metrics |
| `/api/watchlist` | Get user watchlist |
| `/api/watchlist/add` | Add to watchlist |
| `/api/watchlist/remove` | Remove from watchlist |
| `/api/watchlist/alerts` | Watchlist price alerts |

---

## 1. Portfolio Overview

Get a complete view of portfolio holdings and value.

=== "Python"
    ```python
    import requests
    
    def get_portfolio():
        """Get portfolio overview."""
        response = requests.get(
            "https://cryptocurrency.cv/api/portfolio"
        )
        return response.json()
    
    def get_holdings():
        """Get portfolio holdings."""
        response = requests.get(
            "https://cryptocurrency.cv/api/portfolio/holdings"
        )
        return response.json()
    
    # Get portfolio overview
    portfolio = get_portfolio()
    
    print("💼 Portfolio Overview")
    print("=" * 70)
    
    total_value = portfolio.get('totalValue', 0)
    change_24h = portfolio.get('change24h', 0)
    change_7d = portfolio.get('change7d', 0)
    pnl = portfolio.get('totalPnL', 0)
    pnl_percent = portfolio.get('pnlPercent', 0)
    
    print(f"   Total Value: ${total_value:,.2f}")
    print(f"   24h Change: {change_24h:+.2f}%")
    print(f"   7d Change: {change_7d:+.2f}%")
    print(f"   Total P&L: ${pnl:+,.2f} ({pnl_percent:+.2f}%)")
    
    # Get holdings
    holdings = get_holdings()
    
    print("\n📊 Holdings:")
    print(f"   {'Asset':<15} {'Amount':<15} {'Value':<15} {'P&L':<15} {'24h':<10}")
    print("   " + "-" * 65)
    
    for holding in holdings.get('holdings', [])[:10]:
        symbol = holding.get('symbol', 'N/A')
        amount = holding.get('amount', 0)
        value = holding.get('value', 0)
        pnl = holding.get('pnl', 0)
        change = holding.get('change24h', 0)
        
        pnl_str = f"${pnl:+,.0f}" if pnl >= 0 else f"-${abs(pnl):,.0f}"
        change_icon = "🟢" if change >= 0 else "🔴"
        
        print(f"   {symbol:<15} {amount:<15.4f} ${value:<14,.2f} {pnl_str:<15} {change_icon} {change:+.1f}%")
    
    # Portfolio allocation
    print("\n📈 Allocation:")
    for holding in holdings.get('holdings', [])[:5]:
        symbol = holding.get('symbol', 'N/A')
        allocation = holding.get('allocation', 0)
        bar = "█" * int(allocation / 5) + "░" * (20 - int(allocation / 5))
        print(f"   {symbol:<8} [{bar}] {allocation:.1f}%")
    ```

=== "JavaScript"
    ```javascript
    async function getPortfolio() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/portfolio'
        );
        return response.json();
    }
    
    async function getHoldings() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/portfolio/holdings'
        );
        return response.json();
    }
    
    // Get portfolio overview
    const portfolio = await getPortfolio();
    
    console.log("💼 Portfolio Overview");
    console.log("=".repeat(70));
    console.log(`   Total Value: $${portfolio.totalValue?.toLocaleString()}`);
    console.log(`   24h Change: ${portfolio.change24h?.toFixed(2)}%`);
    console.log(`   7d Change: ${portfolio.change7d?.toFixed(2)}%`);
    console.log(`   Total P&L: $${portfolio.totalPnL?.toLocaleString()} (${portfolio.pnlPercent?.toFixed(2)}%)`);
    
    // Get holdings
    const holdings = await getHoldings();
    
    console.log("\n📊 Holdings:");
    holdings.holdings?.slice(0, 10).forEach(holding => {
        const pnlStr = holding.pnl >= 0 ? `+$${holding.pnl.toFixed(0)}` : `-$${Math.abs(holding.pnl).toFixed(0)}`;
        const changeIcon = holding.change24h >= 0 ? '🟢' : '🔴';
        
        console.log(`   ${holding.symbol.padEnd(15)} $${holding.value?.toFixed(2)} ${pnlStr} ${changeIcon}`);
    });
    
    // Allocation
    console.log("\n📈 Allocation:");
    holdings.holdings?.slice(0, 5).forEach(holding => {
        const bar = '█'.repeat(Math.floor(holding.allocation / 5)) + 
                   '░'.repeat(20 - Math.floor(holding.allocation / 5));
        console.log(`   ${holding.symbol.padEnd(8)} [${bar}] ${holding.allocation?.toFixed(1)}%`);
    });
    ```

=== "cURL"
    ```bash
    # Get portfolio overview
    curl "https://cryptocurrency.cv/api/portfolio" | jq
    
    # Get holdings
    curl "https://cryptocurrency.cv/api/portfolio/holdings" | jq
    
    # Get just total value
    curl "https://cryptocurrency.cv/api/portfolio" | jq '.totalValue'
    
    # Get top holding
    curl "https://cryptocurrency.cv/api/portfolio/holdings" | jq '.holdings[0]'
    ```

---

## 2. Transaction History

Track all portfolio transactions.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_transactions(
        asset: str = None,
        type: str = None,
        start_date: str = None,
        end_date: str = None,
        limit: int = 100
    ):
        """Get portfolio transactions."""
        params = {"limit": limit}
        if asset:
            params["asset"] = asset
        if type:
            params["type"] = type
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        
        response = requests.get(
            "https://cryptocurrency.cv/api/portfolio/transactions",
            params=params
        )
        return response.json()
    
    # Get all transactions
    transactions = get_transactions(limit=50)
    
    print("📋 Transaction History")
    print("=" * 70)
    print(f"   Total Transactions: {transactions.get('count', 0)}")
    
    print(f"\n   {'Date':<12} {'Type':<8} {'Asset':<8} {'Amount':<12} {'Price':<12} {'Total':<12}")
    print("   " + "-" * 65)
    
    for tx in transactions.get('transactions', [])[:15]:
        date = tx.get('date', '')[:10]
        tx_type = tx.get('type', 'N/A')
        asset = tx.get('asset', 'N/A')
        amount = tx.get('amount', 0)
        price = tx.get('price', 0)
        total = tx.get('total', 0)
        
        type_icon = "🟢" if tx_type == 'buy' else "🔴" if tx_type == 'sell' else "🔄"
        
        print(f"   {date:<12} {type_icon} {tx_type:<6} {asset:<8} {amount:<12.4f} ${price:<11,.2f} ${total:<11,.2f}")
    
    # Filter by asset
    print("\n📊 BTC Transactions:")
    btc_tx = get_transactions(asset="BTC", limit=10)
    
    total_bought = 0
    total_sold = 0
    
    for tx in btc_tx.get('transactions', []):
        if tx.get('type') == 'buy':
            total_bought += tx.get('amount', 0)
        elif tx.get('type') == 'sell':
            total_sold += tx.get('amount', 0)
        
        print(f"   • {tx.get('type').upper()}: {tx.get('amount', 0):.4f} BTC @ ${tx.get('price', 0):,.2f}")
    
    print(f"\n   Net BTC: {total_bought - total_sold:.4f}")
    
    # Transaction summary
    print("\n📈 Transaction Summary by Type:")
    for tx_type in ['buy', 'sell', 'transfer', 'swap']:
        type_tx = get_transactions(type=tx_type, limit=100)
        count = type_tx.get('count', 0)
        total = sum(tx.get('total', 0) for tx in type_tx.get('transactions', []))
        print(f"   {tx_type.title():10} {count:5} transactions  ${total:>12,.2f}")
    ```

=== "JavaScript"
    ```javascript
    async function getTransactions(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString()
        });
        if (options.asset) params.set('asset', options.asset);
        if (options.type) params.set('type', options.type);
        if (options.startDate) params.set('startDate', options.startDate);
        if (options.endDate) params.set('endDate', options.endDate);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/portfolio/transactions?${params}`
        );
        return response.json();
    }
    
    // Get all transactions
    const transactions = await getTransactions({ limit: 50 });
    
    console.log("📋 Transaction History");
    console.log("=".repeat(70));
    console.log(`   Total Transactions: ${transactions.count}`);
    
    transactions.transactions?.slice(0, 15).forEach(tx => {
        const typeIcon = tx.type === 'buy' ? '🟢' : tx.type === 'sell' ? '🔴' : '🔄';
        console.log(`   ${tx.date?.slice(0,10)} ${typeIcon} ${tx.type} ${tx.asset} ${tx.amount?.toFixed(4)} @ $${tx.price?.toFixed(2)}`);
    });
    
    // BTC transactions
    console.log("\n📊 BTC Transactions:");
    const btcTx = await getTransactions({ asset: 'BTC', limit: 10 });
    
    let totalBought = 0, totalSold = 0;
    btcTx.transactions?.forEach(tx => {
        if (tx.type === 'buy') totalBought += tx.amount;
        else if (tx.type === 'sell') totalSold += tx.amount;
        console.log(`   • ${tx.type.toUpperCase()}: ${tx.amount?.toFixed(4)} BTC @ $${tx.price?.toLocaleString()}`);
    });
    
    console.log(`\n   Net BTC: ${(totalBought - totalSold).toFixed(4)}`);
    ```

=== "cURL"
    ```bash
    # Get all transactions
    curl "https://cryptocurrency.cv/api/portfolio/transactions?limit=50" | jq
    
    # Get BTC transactions
    curl "https://cryptocurrency.cv/api/portfolio/transactions?asset=BTC" | jq
    
    # Get buy transactions only
    curl "https://cryptocurrency.cv/api/portfolio/transactions?type=buy" | jq
    
    # Get transactions in date range
    curl "https://cryptocurrency.cv/api/portfolio/transactions?startDate=2024-01-01&endDate=2024-12-31" | jq
    ```

---

## 3. Performance Metrics

Analyze portfolio performance over time.

=== "Python"
    ```python
    import requests
    
    def get_performance(period: str = "1M"):
        """Get portfolio performance metrics."""
        response = requests.get(
            "https://cryptocurrency.cv/api/portfolio/performance",
            params={"period": period}
        )
        return response.json()
    
    # Get performance for different periods
    periods = ["24H", "7D", "1M", "3M", "1Y", "ALL"]
    
    print("📈 Portfolio Performance")
    print("=" * 70)
    
    print(f"   {'Period':<10} {'Return':<15} {'P&L':<15} {'Best Day':<12} {'Worst Day':<12}")
    print("   " + "-" * 60)
    
    for period in periods:
        perf = get_performance(period)
        
        return_pct = perf.get('returnPercent', 0)
        pnl = perf.get('pnl', 0)
        best = perf.get('bestDay', 0)
        worst = perf.get('worstDay', 0)
        
        return_icon = "🟢" if return_pct >= 0 else "🔴"
        pnl_str = f"${pnl:+,.0f}" if pnl >= 0 else f"-${abs(pnl):,.0f}"
        
        print(f"   {period:<10} {return_icon} {return_pct:+.2f}%{'':<8} {pnl_str:<15} {best:+.2f}%{'':<5} {worst:+.2f}%")
    
    # Detailed 1M performance
    print("\n📊 Detailed Monthly Performance:")
    monthly = get_performance("1M")
    
    print(f"   Start Value: ${monthly.get('startValue', 0):,.2f}")
    print(f"   End Value: ${monthly.get('endValue', 0):,.2f}")
    print(f"   Net Deposits: ${monthly.get('netDeposits', 0):,.2f}")
    print(f"   Net Return: ${monthly.get('pnl', 0):+,.2f} ({monthly.get('returnPercent', 0):+.2f}%)")
    
    print("\n   Daily Returns:")
    for day in monthly.get('dailyReturns', [])[:7]:
        date = day.get('date', '')
        ret = day.get('return', 0)
        bar_len = int(abs(ret) * 10)
        bar = ("+" * bar_len if ret >= 0 else "-" * bar_len).ljust(20)
        print(f"   {date}: [{bar}] {ret:+.2f}%")
    
    # Risk metrics
    print("\n⚠️ Risk Metrics:")
    print(f"   Sharpe Ratio: {monthly.get('sharpeRatio', 0):.2f}")
    print(f"   Max Drawdown: {monthly.get('maxDrawdown', 0):.2f}%")
    print(f"   Volatility: {monthly.get('volatility', 0):.2f}%")
    print(f"   Beta (vs BTC): {monthly.get('beta', 0):.2f}")
    ```

=== "JavaScript"
    ```javascript
    async function getPerformance(period = '1M') {
        const response = await fetch(
            `https://cryptocurrency.cv/api/portfolio/performance?period=${period}`
        );
        return response.json();
    }
    
    const periods = ['24H', '7D', '1M', '3M', '1Y', 'ALL'];
    
    console.log("📈 Portfolio Performance");
    console.log("=".repeat(70));
    
    for (const period of periods) {
        const perf = await getPerformance(period);
        const returnIcon = perf.returnPercent >= 0 ? '🟢' : '🔴';
        const pnlStr = perf.pnl >= 0 ? `+$${perf.pnl.toFixed(0)}` : `-$${Math.abs(perf.pnl).toFixed(0)}`;
        
        console.log(`   ${period.padEnd(10)} ${returnIcon} ${perf.returnPercent?.toFixed(2)}% ${pnlStr}`);
    }
    
    // Detailed monthly
    console.log("\n📊 Detailed Monthly Performance:");
    const monthly = await getPerformance('1M');
    
    console.log(`   Start Value: $${monthly.startValue?.toLocaleString()}`);
    console.log(`   End Value: $${monthly.endValue?.toLocaleString()}`);
    console.log(`   Net Return: $${monthly.pnl?.toLocaleString()} (${monthly.returnPercent?.toFixed(2)}%)`);
    
    // Risk metrics
    console.log("\n⚠️ Risk Metrics:");
    console.log(`   Sharpe Ratio: ${monthly.sharpeRatio?.toFixed(2)}`);
    console.log(`   Max Drawdown: ${monthly.maxDrawdown?.toFixed(2)}%`);
    console.log(`   Volatility: ${monthly.volatility?.toFixed(2)}%`);
    ```

=== "cURL"
    ```bash
    # Get 1M performance
    curl "https://cryptocurrency.cv/api/portfolio/performance?period=1M" | jq
    
    # Get all-time performance
    curl "https://cryptocurrency.cv/api/portfolio/performance?period=ALL" | jq
    
    # Get just return percent
    curl "https://cryptocurrency.cv/api/portfolio/performance?period=1Y" | jq '.returnPercent'
    ```

---

## 4. Watchlist Management

Create and manage your crypto watchlist.

=== "Python"
    ```python
    import requests
    
    def get_watchlist():
        """Get user watchlist."""
        response = requests.get(
            "https://cryptocurrency.cv/api/watchlist"
        )
        return response.json()
    
    def add_to_watchlist(symbol: str, alert_price: float = None):
        """Add asset to watchlist."""
        data = {"symbol": symbol}
        if alert_price:
            data["alertPrice"] = alert_price
        
        response = requests.post(
            "https://cryptocurrency.cv/api/watchlist/add",
            json=data
        )
        return response.json()
    
    def remove_from_watchlist(symbol: str):
        """Remove asset from watchlist."""
        response = requests.delete(
            "https://cryptocurrency.cv/api/watchlist/remove",
            params={"symbol": symbol}
        )
        return response.json()
    
    def get_watchlist_alerts():
        """Get watchlist price alerts."""
        response = requests.get(
            "https://cryptocurrency.cv/api/watchlist/alerts"
        )
        return response.json()
    
    # Get current watchlist
    watchlist = get_watchlist()
    
    print("👀 Watchlist")
    print("=" * 70)
    print(f"   Watching {watchlist.get('count', 0)} assets")
    
    print(f"\n   {'Symbol':<10} {'Price':<15} {'24h':<12} {'7d':<12} {'Alert':<15}")
    print("   " + "-" * 60)
    
    for asset in watchlist.get('assets', []):
        symbol = asset.get('symbol', 'N/A')
        price = asset.get('price', 0)
        change_24h = asset.get('change24h', 0)
        change_7d = asset.get('change7d', 0)
        alert = asset.get('alertPrice')
        
        icon_24h = "🟢" if change_24h >= 0 else "🔴"
        icon_7d = "🟢" if change_7d >= 0 else "🔴"
        alert_str = f"${alert:,.2f}" if alert else "Not set"
        
        print(f"   {symbol:<10} ${price:<14,.2f} {icon_24h} {change_24h:+.2f}%{'':<4} {icon_7d} {change_7d:+.2f}%{'':<4} {alert_str}")
    
    # Add to watchlist
    print("\n➕ Adding to watchlist...")
    result = add_to_watchlist("SOL", alert_price=200.00)
    if result.get('success'):
        print(f"   ✅ Added SOL with alert at $200.00")
    
    # Get alerts
    print("\n🔔 Active Alerts:")
    alerts = get_watchlist_alerts()
    
    for alert in alerts.get('alerts', []):
        symbol = alert.get('symbol', 'N/A')
        current = alert.get('currentPrice', 0)
        target = alert.get('targetPrice', 0)
        direction = alert.get('direction', 'above')
        distance = ((target - current) / current) * 100
        
        status = "🔴 Below" if direction == "below" else "🟢 Above"
        print(f"   {symbol}: Current ${current:,.2f} → Target ${target:,.2f} ({status}) ({distance:+.1f}%)")
    ```

=== "JavaScript"
    ```javascript
    async function getWatchlist() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/watchlist'
        );
        return response.json();
    }
    
    async function addToWatchlist(symbol, alertPrice = null) {
        const body = { symbol };
        if (alertPrice) body.alertPrice = alertPrice;
        
        const response = await fetch(
            'https://cryptocurrency.cv/api/watchlist/add',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );
        return response.json();
    }
    
    async function removeFromWatchlist(symbol) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/watchlist/remove?symbol=${symbol}`,
            { method: 'DELETE' }
        );
        return response.json();
    }
    
    async function getWatchlistAlerts() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/watchlist/alerts'
        );
        return response.json();
    }
    
    // Get watchlist
    const watchlist = await getWatchlist();
    
    console.log("👀 Watchlist");
    console.log("=".repeat(70));
    console.log(`   Watching ${watchlist.count} assets`);
    
    watchlist.assets?.forEach(asset => {
        const icon24h = asset.change24h >= 0 ? '🟢' : '🔴';
        const alertStr = asset.alertPrice ? `$${asset.alertPrice.toFixed(2)}` : 'Not set';
        
        console.log(`   ${asset.symbol.padEnd(10)} $${asset.price?.toFixed(2)} ${icon24h} ${asset.change24h?.toFixed(2)}% Alert: ${alertStr}`);
    });
    
    // Add to watchlist
    console.log("\n➕ Adding SOL to watchlist...");
    const result = await addToWatchlist('SOL', 200.00);
    if (result.success) {
        console.log("   ✅ Added SOL with alert at $200.00");
    }
    
    // Get alerts
    console.log("\n🔔 Active Alerts:");
    const alerts = await getWatchlistAlerts();
    alerts.alerts?.forEach(alert => {
        const distance = ((alert.targetPrice - alert.currentPrice) / alert.currentPrice * 100);
        console.log(`   ${alert.symbol}: $${alert.currentPrice?.toFixed(2)} → $${alert.targetPrice?.toFixed(2)} (${distance.toFixed(1)}%)`);
    });
    ```

=== "cURL"
    ```bash
    # Get watchlist
    curl "https://cryptocurrency.cv/api/watchlist" | jq
    
    # Add to watchlist
    curl -X POST "https://cryptocurrency.cv/api/watchlist/add" \
      -H "Content-Type: application/json" \
      -d '{"symbol": "SOL", "alertPrice": 200.00}' | jq
    
    # Remove from watchlist
    curl -X DELETE "https://cryptocurrency.cv/api/watchlist/remove?symbol=SOL" | jq
    
    # Get alerts
    curl "https://cryptocurrency.cv/api/watchlist/alerts" | jq
    ```

---

## Complete Portfolio Manager Application

Build a complete portfolio management application:

```python
#!/usr/bin/env python3
"""Complete portfolio management application."""

import requests
from datetime import datetime
from typing import Dict, Any, Optional

class PortfolioManager:
    """Portfolio management client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def _post(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.BASE_URL}{endpoint}",
            json=data
        )
        return response.json()
    
    # Portfolio methods
    def get_portfolio(self):
        return self._get("/api/portfolio")
    
    def get_holdings(self):
        return self._get("/api/portfolio/holdings")
    
    def get_transactions(self, **kwargs):
        return self._get("/api/portfolio/transactions", kwargs)
    
    def get_performance(self, period: str = "1M"):
        return self._get("/api/portfolio/performance", {"period": period})
    
    # Watchlist methods
    def get_watchlist(self):
        return self._get("/api/watchlist")
    
    def add_to_watchlist(self, symbol: str, alert_price: float = None):
        data = {"symbol": symbol}
        if alert_price:
            data["alertPrice"] = alert_price
        return self._post("/api/watchlist/add", data)
    
    def get_alerts(self):
        return self._get("/api/watchlist/alerts")
    
    def run_dashboard(self):
        """Run portfolio dashboard."""
        print("=" * 80)
        print("💼 PORTFOLIO DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Portfolio Overview
        print("\n📊 PORTFOLIO OVERVIEW")
        print("-" * 80)
        try:
            portfolio = self.get_portfolio()
            print(f"   Total Value: ${portfolio.get('totalValue', 0):,.2f}")
            print(f"   24h Change: {portfolio.get('change24h', 0):+.2f}%")
            print(f"   Total P&L: ${portfolio.get('totalPnL', 0):+,.2f}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Holdings
        print("\n💰 TOP HOLDINGS")
        print("-" * 80)
        try:
            holdings = self.get_holdings()
            for h in holdings.get('holdings', [])[:5]:
                alloc = h.get('allocation', 0)
                bar = "█" * int(alloc / 5) + "░" * (20 - int(alloc / 5))
                print(f"   {h.get('symbol', 'N/A'):<8} [{bar}] {alloc:.1f}% (${h.get('value', 0):,.2f})")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Performance
        print("\n📈 PERFORMANCE")
        print("-" * 80)
        try:
            for period in ["24H", "7D", "1M", "1Y"]:
                perf = self.get_performance(period)
                icon = "🟢" if perf.get('returnPercent', 0) >= 0 else "🔴"
                print(f"   {period:6} {icon} {perf.get('returnPercent', 0):+.2f}% (${perf.get('pnl', 0):+,.0f})")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Recent Transactions
        print("\n📋 RECENT TRANSACTIONS")
        print("-" * 80)
        try:
            transactions = self.get_transactions(limit=5)
            for tx in transactions.get('transactions', []):
                icon = "🟢" if tx.get('type') == 'buy' else "🔴"
                print(f"   {tx.get('date', '')[:10]} {icon} {tx.get('type', 'N/A').upper():6} {tx.get('asset', 'N/A'):6} {tx.get('amount', 0):.4f}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Watchlist
        print("\n👀 WATCHLIST")
        print("-" * 80)
        try:
            watchlist = self.get_watchlist()
            for asset in watchlist.get('assets', [])[:5]:
                icon = "🟢" if asset.get('change24h', 0) >= 0 else "🔴"
                print(f"   {asset.get('symbol', 'N/A'):<8} ${asset.get('price', 0):>10,.2f} {icon} {asset.get('change24h', 0):+.2f}%")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Alerts
        print("\n🔔 ACTIVE ALERTS")
        print("-" * 80)
        try:
            alerts = self.get_alerts()
            for alert in alerts.get('alerts', [])[:5]:
                dist = ((alert.get('targetPrice', 0) - alert.get('currentPrice', 1)) / alert.get('currentPrice', 1)) * 100
                print(f"   {alert.get('symbol', 'N/A')}: ${alert.get('currentPrice', 0):,.2f} → ${alert.get('targetPrice', 0):,.2f} ({dist:+.1f}%)")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    manager = PortfolioManager()
    manager.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [Trading Signals](trading-signals.md) - Get trading recommendations
- [Market Data](market-data.md) - Real-time prices
- [User Alerts](user-alerts.md) - Configure alert notifications
