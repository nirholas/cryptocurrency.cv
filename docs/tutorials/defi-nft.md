# DeFi & NFT Tutorial

This tutorial covers decentralized finance (DeFi) and NFT-related endpoints for tracking protocols, yields, and digital collectibles.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/defi` | DeFi news and updates |
| `/api/defi/protocols` | DeFi protocol data |
| `/api/defi/yields` | Yield farming opportunities |
| `/api/defi/tvl` | Total Value Locked tracking |
| `/api/nft` | NFT news and trends |
| `/api/nft/collections` | NFT collection data |
| `/api/nft/sales` | Recent NFT sales |

---

## 1. DeFi News & Updates

Get the latest DeFi news and protocol updates.

=== "Python"
    ```python
    import requests
    
    def get_defi_news(category: str = None, protocol: str = None, limit: int = 50):
        """Get DeFi-related news."""
        params = {"limit": limit}
        if category:
            params["category"] = category
        if protocol:
            params["protocol"] = protocol
        
        response = requests.get(
            "https://cryptocurrency.cv/api/defi",
            params=params
        )
        return response.json()
    
    # Get all DeFi news
    defi_news = get_defi_news(limit=20)
    
    print("🏦 DeFi News")
    print("=" * 70)
    print(f"Total Articles: {defi_news.get('count', 0)}")
    
    for article in defi_news.get('articles', [])[:10]:
        title = article.get('title', '')[:55]
        category = article.get('category', 'general')
        protocol = article.get('protocol', 'N/A')
        print(f"   [{category}] {title}...")
        if protocol != 'N/A':
            print(f"      Protocol: {protocol}")
    
    # Get by category
    print("\n📊 DeFi Categories:")
    categories = ['lending', 'dex', 'yield', 'staking', 'bridge']
    
    for cat in categories:
        news = get_defi_news(category=cat, limit=5)
        count = news.get('count', 0)
        print(f"\n   {cat.upper()} ({count} articles):")
        for article in news.get('articles', [])[:2]:
            print(f"      • {article.get('title', '')[:50]}...")
    
    # Get by protocol
    print("\n🔷 Protocol-Specific News:")
    protocols = ['uniswap', 'aave', 'compound', 'lido']
    
    for protocol in protocols:
        news = get_defi_news(protocol=protocol, limit=5)
        count = news.get('count', 0)
        print(f"   {protocol.title()}: {count} articles")
    ```

=== "JavaScript"
    ```javascript
    async function getDefiNews(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 50).toString()
        });
        if (options.category) params.set('category', options.category);
        if (options.protocol) params.set('protocol', options.protocol);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/defi?${params}`
        );
        return response.json();
    }
    
    // Get all DeFi news
    const defiNews = await getDefiNews({ limit: 20 });
    
    console.log("🏦 DeFi News");
    console.log("=".repeat(70));
    console.log(`Total Articles: ${defiNews.count}`);
    
    defiNews.articles?.slice(0, 10).forEach(article => {
        console.log(`   [${article.category}] ${article.title?.slice(0, 55)}...`);
        if (article.protocol) {
            console.log(`      Protocol: ${article.protocol}`);
        }
    });
    
    // By category
    console.log("\n📊 DeFi Categories:");
    const categories = ['lending', 'dex', 'yield', 'staking', 'bridge'];
    
    for (const cat of categories) {
        const news = await getDefiNews({ category: cat, limit: 5 });
        console.log(`\n   ${cat.toUpperCase()} (${news.count} articles):`);
        news.articles?.slice(0, 2).forEach(a => {
            console.log(`      • ${a.title?.slice(0, 50)}...`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get all DeFi news
    curl "https://cryptocurrency.cv/api/defi?limit=20" | jq
    
    # Get lending news
    curl "https://cryptocurrency.cv/api/defi?category=lending" | jq
    
    # Get Uniswap news
    curl "https://cryptocurrency.cv/api/defi?protocol=uniswap" | jq
    
    # Get DEX news
    curl "https://cryptocurrency.cv/api/defi?category=dex" | jq
    ```

---

## 2. DeFi Protocols

Get data on DeFi protocols including TVL, users, and metrics.

=== "Python"
    ```python
    import requests
    
    def get_defi_protocols(category: str = None, limit: int = 100):
        """Get DeFi protocol data."""
        params = {"limit": limit}
        if category:
            params["category"] = category
        
        response = requests.get(
            "https://cryptocurrency.cv/api/defi/protocols",
            params=params
        )
        return response.json()
    
    def get_protocol_tvl():
        """Get TVL data for all protocols."""
        response = requests.get(
            "https://cryptocurrency.cv/api/defi/tvl"
        )
        return response.json()
    
    # Get top protocols
    protocols = get_defi_protocols(limit=50)
    
    print("🏦 Top DeFi Protocols")
    print("=" * 70)
    
    total_tvl = 0
    for i, protocol in enumerate(protocols.get('protocols', [])[:20], 1):
        name = protocol.get('name', 'Unknown')
        tvl = protocol.get('tvl', 0)
        total_tvl += tvl
        change_24h = protocol.get('change24h', 0)
        category = protocol.get('category', 'N/A')
        
        tvl_display = f"${tvl/1e9:.2f}B" if tvl >= 1e9 else f"${tvl/1e6:.2f}M"
        change_color = "🟢" if change_24h >= 0 else "🔴"
        
        print(f"   {i:2}. {name:20} {tvl_display:>12} {change_color} {change_24h:+.2f}% [{category}]")
    
    print(f"\n   Total TVL (Top 20): ${total_tvl/1e9:.2f}B")
    
    # Get by category
    print("\n📊 Protocols by Category:")
    categories = ['Lending', 'Dexes', 'Liquid Staking', 'Bridge', 'CDP']
    
    for cat in categories:
        cat_protocols = get_defi_protocols(category=cat, limit=10)
        count = len(cat_protocols.get('protocols', []))
        print(f"\n   {cat} ({count} protocols):")
        for p in cat_protocols.get('protocols', [])[:3]:
            tvl = p.get('tvl', 0)
            tvl_display = f"${tvl/1e9:.2f}B" if tvl >= 1e9 else f"${tvl/1e6:.2f}M"
            print(f"      • {p.get('name')}: {tvl_display}")
    
    # Get TVL aggregates
    print("\n" + "=" * 70)
    print("📈 TVL Overview:")
    
    tvl_data = get_protocol_tvl()
    print(f"   Total DeFi TVL: ${tvl_data.get('totalTvl', 0)/1e9:.2f}B")
    print(f"   24h Change: {tvl_data.get('change24h', 0):+.2f}%")
    print(f"   7d Change: {tvl_data.get('change7d', 0):+.2f}%")
    
    print("\n   By Chain:")
    for chain in tvl_data.get('chains', [])[:10]:
        name = chain.get('name', 'Unknown')
        tvl = chain.get('tvl', 0)
        share = chain.get('share', 0)
        tvl_display = f"${tvl/1e9:.2f}B" if tvl >= 1e9 else f"${tvl/1e6:.2f}M"
        print(f"      {name}: {tvl_display} ({share:.1f}%)")
    ```

=== "JavaScript"
    ```javascript
    async function getDefiProtocols(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString()
        });
        if (options.category) params.set('category', options.category);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/defi/protocols?${params}`
        );
        return response.json();
    }
    
    async function getProtocolTvl() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/defi/tvl'
        );
        return response.json();
    }
    
    // Get top protocols
    const protocols = await getDefiProtocols({ limit: 50 });
    
    console.log("🏦 Top DeFi Protocols");
    console.log("=".repeat(70));
    
    let totalTvl = 0;
    protocols.protocols?.slice(0, 20).forEach((protocol, i) => {
        totalTvl += protocol.tvl || 0;
        const tvlDisplay = protocol.tvl >= 1e9 
            ? `$${(protocol.tvl/1e9).toFixed(2)}B` 
            : `$${(protocol.tvl/1e6).toFixed(2)}M`;
        const changeIcon = (protocol.change24h || 0) >= 0 ? '🟢' : '🔴';
        
        console.log(`   ${i+1}. ${protocol.name.padEnd(20)} ${tvlDisplay.padStart(12)} ${changeIcon} ${protocol.change24h?.toFixed(2)}%`);
    });
    
    console.log(`\n   Total TVL (Top 20): $${(totalTvl/1e9).toFixed(2)}B`);
    
    // TVL overview
    const tvlData = await getProtocolTvl();
    console.log("\n📈 TVL Overview:");
    console.log(`   Total DeFi TVL: $${(tvlData.totalTvl/1e9).toFixed(2)}B`);
    console.log(`   24h Change: ${tvlData.change24h?.toFixed(2)}%`);
    ```

=== "cURL"
    ```bash
    # Get all protocols
    curl "https://cryptocurrency.cv/api/defi/protocols?limit=50" | jq
    
    # Get lending protocols
    curl "https://cryptocurrency.cv/api/defi/protocols?category=Lending" | jq
    
    # Get TVL data
    curl "https://cryptocurrency.cv/api/defi/tvl" | jq
    
    # Get top 10 by TVL
    curl "https://cryptocurrency.cv/api/defi/protocols" | jq '.protocols | sort_by(-.tvl) | .[0:10]'
    ```

---

## 3. Yield Farming Opportunities

Find the best yield farming opportunities across protocols.

=== "Python"
    ```python
    import requests
    
    def get_defi_yields(chain: str = None, stablecoin: bool = None, 
                        min_apy: float = None, limit: int = 100):
        """Get DeFi yield opportunities."""
        params = {"limit": limit}
        if chain:
            params["chain"] = chain
        if stablecoin is not None:
            params["stablecoin"] = stablecoin
        if min_apy:
            params["minApy"] = min_apy
        
        response = requests.get(
            "https://cryptocurrency.cv/api/defi/yields",
            params=params
        )
        return response.json()
    
    # Get top yields
    yields = get_defi_yields(limit=50)
    
    print("🌾 Top DeFi Yield Opportunities")
    print("=" * 70)
    
    for i, pool in enumerate(yields.get('pools', [])[:20], 1):
        protocol = pool.get('protocol', 'Unknown')[:12]
        chain = pool.get('chain', 'N/A')[:8]
        symbol = pool.get('symbol', 'N/A')[:10]
        apy = pool.get('apy', 0)
        tvl = pool.get('tvl', 0)
        
        tvl_display = f"${tvl/1e6:.1f}M" if tvl >= 1e6 else f"${tvl/1e3:.1f}K"
        
        print(f"   {i:2}. {protocol:12} {symbol:10} {apy:>8.2f}% APY  {tvl_display:>10} [{chain}]")
    
    # Stablecoin yields
    print("\n💵 Stablecoin Yields:")
    stable_yields = get_defi_yields(stablecoin=True, limit=20)
    
    for pool in stable_yields.get('pools', [])[:10]:
        print(f"   • {pool.get('protocol')}: {pool.get('symbol')} - {pool.get('apy'):.2f}% APY")
    
    # High APY opportunities
    print("\n🔥 High APY (>50%):")
    high_yields = get_defi_yields(min_apy=50, limit=20)
    
    for pool in high_yields.get('pools', [])[:10]:
        apy = pool.get('apy', 0)
        risk = "⚠️" if apy > 100 else ""
        print(f"   {risk} {pool.get('protocol')}: {pool.get('symbol')} - {apy:.2f}% APY")
    
    # By chain
    print("\n⛓️ Yields by Chain:")
    chains = ['Ethereum', 'Arbitrum', 'Optimism', 'BSC', 'Polygon']
    
    for chain in chains:
        chain_yields = get_defi_yields(chain=chain, limit=10)
        avg_apy = sum(p.get('apy', 0) for p in chain_yields.get('pools', [])) / max(1, len(chain_yields.get('pools', [])))
        count = len(chain_yields.get('pools', []))
        print(f"   {chain}: {count} pools, avg {avg_apy:.2f}% APY")
    ```

=== "JavaScript"
    ```javascript
    async function getDefiYields(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString()
        });
        if (options.chain) params.set('chain', options.chain);
        if (options.stablecoin !== undefined) params.set('stablecoin', options.stablecoin);
        if (options.minApy) params.set('minApy', options.minApy);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/defi/yields?${params}`
        );
        return response.json();
    }
    
    // Get top yields
    const yields = await getDefiYields({ limit: 50 });
    
    console.log("🌾 Top DeFi Yield Opportunities");
    console.log("=".repeat(70));
    
    yields.pools?.slice(0, 20).forEach((pool, i) => {
        const tvlDisplay = pool.tvl >= 1e6 
            ? `$${(pool.tvl/1e6).toFixed(1)}M` 
            : `$${(pool.tvl/1e3).toFixed(1)}K`;
        
        console.log(`   ${i+1}. ${pool.protocol?.slice(0,12).padEnd(12)} ${pool.symbol?.slice(0,10).padEnd(10)} ${pool.apy?.toFixed(2).padStart(8)}% APY ${tvlDisplay.padStart(10)} [${pool.chain}]`);
    });
    
    // Stablecoin yields
    console.log("\n💵 Stablecoin Yields:");
    const stableYields = await getDefiYields({ stablecoin: true, limit: 20 });
    stableYields.pools?.slice(0, 10).forEach(pool => {
        console.log(`   • ${pool.protocol}: ${pool.symbol} - ${pool.apy?.toFixed(2)}% APY`);
    });
    
    // High APY
    console.log("\n🔥 High APY (>50%):");
    const highYields = await getDefiYields({ minApy: 50, limit: 20 });
    highYields.pools?.slice(0, 10).forEach(pool => {
        const risk = pool.apy > 100 ? '⚠️' : '';
        console.log(`   ${risk} ${pool.protocol}: ${pool.symbol} - ${pool.apy?.toFixed(2)}% APY`);
    });
    ```

=== "cURL"
    ```bash
    # Get all yields
    curl "https://cryptocurrency.cv/api/defi/yields?limit=50" | jq
    
    # Get stablecoin yields
    curl "https://cryptocurrency.cv/api/defi/yields?stablecoin=true" | jq
    
    # Get high APY opportunities
    curl "https://cryptocurrency.cv/api/defi/yields?minApy=50" | jq
    
    # Get Ethereum yields
    curl "https://cryptocurrency.cv/api/defi/yields?chain=Ethereum" | jq
    ```

---

## 4. NFT News & Trends

Get news and data about NFTs and digital collectibles.

=== "Python"
    ```python
    import requests
    
    def get_nft_news(collection: str = None, category: str = None, limit: int = 50):
        """Get NFT-related news."""
        params = {"limit": limit}
        if collection:
            params["collection"] = collection
        if category:
            params["category"] = category
        
        response = requests.get(
            "https://cryptocurrency.cv/api/nft",
            params=params
        )
        return response.json()
    
    def get_nft_collections(chain: str = None, limit: int = 100):
        """Get NFT collection data."""
        params = {"limit": limit}
        if chain:
            params["chain"] = chain
        
        response = requests.get(
            "https://cryptocurrency.cv/api/nft/collections",
            params=params
        )
        return response.json()
    
    def get_nft_sales(limit: int = 50):
        """Get recent NFT sales."""
        response = requests.get(
            "https://cryptocurrency.cv/api/nft/sales",
            params={"limit": limit}
        )
        return response.json()
    
    # Get NFT news
    nft_news = get_nft_news(limit=20)
    
    print("🖼️ NFT News")
    print("=" * 70)
    
    for article in nft_news.get('articles', [])[:10]:
        title = article.get('title', '')[:55]
        collection = article.get('collection', '')
        print(f"   • {title}...")
        if collection:
            print(f"      Collection: {collection}")
    
    # Get top collections
    print("\n🏆 Top NFT Collections:")
    collections = get_nft_collections(limit=20)
    
    for i, collection in enumerate(collections.get('collections', [])[:15], 1):
        name = collection.get('name', 'Unknown')[:20]
        floor = collection.get('floorPrice', 0)
        volume = collection.get('volume24h', 0)
        change = collection.get('change24h', 0)
        
        change_icon = "🟢" if change >= 0 else "🔴"
        print(f"   {i:2}. {name:20} Floor: {floor:.3f}Ξ  Vol: {volume:.1f}Ξ {change_icon} {change:+.1f}%")
    
    # Recent sales
    print("\n💰 Recent Big Sales:")
    sales = get_nft_sales(limit=20)
    
    for sale in sales.get('sales', [])[:10]:
        collection = sale.get('collection', 'Unknown')[:15]
        token_id = sale.get('tokenId', 'N/A')
        price = sale.get('price', 0)
        currency = sale.get('currency', 'ETH')
        print(f"   • {collection} #{token_id}: {price:.2f} {currency}")
    ```

=== "JavaScript"
    ```javascript
    async function getNftNews(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 50).toString()
        });
        if (options.collection) params.set('collection', options.collection);
        if (options.category) params.set('category', options.category);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/nft?${params}`
        );
        return response.json();
    }
    
    async function getNftCollections(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString()
        });
        if (options.chain) params.set('chain', options.chain);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/nft/collections?${params}`
        );
        return response.json();
    }
    
    async function getNftSales(limit = 50) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/nft/sales?limit=${limit}`
        );
        return response.json();
    }
    
    // Get NFT news
    const nftNews = await getNftNews({ limit: 20 });
    
    console.log("🖼️ NFT News");
    console.log("=".repeat(70));
    
    nftNews.articles?.slice(0, 10).forEach(article => {
        console.log(`   • ${article.title?.slice(0, 55)}...`);
        if (article.collection) {
            console.log(`      Collection: ${article.collection}`);
        }
    });
    
    // Top collections
    console.log("\n🏆 Top NFT Collections:");
    const collections = await getNftCollections({ limit: 20 });
    
    collections.collections?.slice(0, 15).forEach((coll, i) => {
        const changeIcon = (coll.change24h || 0) >= 0 ? '🟢' : '🔴';
        console.log(`   ${i+1}. ${coll.name?.slice(0,20).padEnd(20)} Floor: ${coll.floorPrice?.toFixed(3)}Ξ ${changeIcon}`);
    });
    
    // Recent sales
    console.log("\n💰 Recent Big Sales:");
    const sales = await getNftSales(20);
    
    sales.sales?.slice(0, 10).forEach(sale => {
        console.log(`   • ${sale.collection?.slice(0,15)} #${sale.tokenId}: ${sale.price?.toFixed(2)} ${sale.currency || 'ETH'}`);
    });
    ```

=== "cURL"
    ```bash
    # Get NFT news
    curl "https://cryptocurrency.cv/api/nft?limit=20" | jq
    
    # Get NFT collections
    curl "https://cryptocurrency.cv/api/nft/collections?limit=20" | jq
    
    # Get recent sales
    curl "https://cryptocurrency.cv/api/nft/sales?limit=20" | jq
    
    # Get Ethereum NFTs only
    curl "https://cryptocurrency.cv/api/nft/collections?chain=ethereum" | jq
    ```

---

## Complete DeFi & NFT Dashboard

Build a comprehensive DeFi and NFT monitoring dashboard:

```python
#!/usr/bin/env python3
"""DeFi and NFT monitoring dashboard."""

import requests
from datetime import datetime
from typing import Dict, Any

class DeFiNFTDashboard:
    """DeFi and NFT monitoring dashboard."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    # DeFi methods
    def get_defi_news(self, **kwargs):
        return self._get("/api/defi", kwargs)
    
    def get_protocols(self, **kwargs):
        return self._get("/api/defi/protocols", kwargs)
    
    def get_tvl(self):
        return self._get("/api/defi/tvl")
    
    def get_yields(self, **kwargs):
        return self._get("/api/defi/yields", kwargs)
    
    # NFT methods
    def get_nft_news(self, **kwargs):
        return self._get("/api/nft", kwargs)
    
    def get_collections(self, **kwargs):
        return self._get("/api/nft/collections", kwargs)
    
    def get_sales(self, limit: int = 50):
        return self._get("/api/nft/sales", {"limit": limit})
    
    def run_dashboard(self):
        """Run the complete dashboard."""
        print("=" * 80)
        print("🏦 DEFI & NFT DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # DeFi Section
        print("\n" + "=" * 80)
        print("📊 DEFI OVERVIEW")
        print("=" * 80)
        
        try:
            # TVL
            tvl = self.get_tvl()
            total_tvl = tvl.get('totalTvl', 0)
            print(f"\n💰 Total Value Locked: ${total_tvl/1e9:.2f}B")
            print(f"   24h Change: {tvl.get('change24h', 0):+.2f}%")
            
            # Top protocols
            print("\n🏆 Top Protocols by TVL:")
            protocols = self.get_protocols(limit=10)
            for i, p in enumerate(protocols.get('protocols', [])[:5], 1):
                tvl_val = p.get('tvl', 0)
                tvl_display = f"${tvl_val/1e9:.2f}B" if tvl_val >= 1e9 else f"${tvl_val/1e6:.0f}M"
                print(f"   {i}. {p.get('name', 'Unknown'):20} {tvl_display}")
            
            # Best yields
            print("\n🌾 Best Stablecoin Yields:")
            yields = self.get_yields(stablecoin=True, limit=5)
            for pool in yields.get('pools', [])[:5]:
                print(f"   • {pool.get('protocol')}: {pool.get('symbol')} - {pool.get('apy', 0):.2f}% APY")
            
        except Exception as e:
            print(f"   Error loading DeFi data: {e}")
        
        # NFT Section
        print("\n" + "=" * 80)
        print("🖼️ NFT OVERVIEW")
        print("=" * 80)
        
        try:
            # Top collections
            print("\n🏆 Top NFT Collections:")
            collections = self.get_collections(limit=10)
            for i, c in enumerate(collections.get('collections', [])[:5], 1):
                floor = c.get('floorPrice', 0)
                change = c.get('change24h', 0)
                icon = "🟢" if change >= 0 else "🔴"
                print(f"   {i}. {c.get('name', 'Unknown')[:20]:20} {floor:.3f}Ξ {icon} {change:+.1f}%")
            
            # Recent sales
            print("\n💰 Recent Notable Sales:")
            sales = self.get_sales(limit=10)
            for sale in sales.get('sales', [])[:5]:
                coll = sale.get('collection', 'Unknown')[:20]
                price = sale.get('price', 0)
                print(f"   • {coll}: {price:.2f} ETH")
            
            # NFT news
            print("\n📰 Latest NFT News:")
            news = self.get_nft_news(limit=5)
            for article in news.get('articles', [])[:5]:
                print(f"   • {article.get('title', '')[:60]}...")
                
        except Exception as e:
            print(f"   Error loading NFT data: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    dashboard = DeFiNFTDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [Market Data Tutorial](market-data.md) - Price and exchange data
- [Trading Signals](trading-signals.md) - Trading analysis
- [AI Features](ai-features.md) - AI analysis of DeFi news
