#!/usr/bin/env python3

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
DeFi API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for all DeFi-related endpoints including yields, stablecoins,
protocol health, bridges, and DEX volumes.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/defi - DeFi News & Overview
# =============================================================================

def get_defi(limit: int = 20) -> dict:
    """
    Get DeFi news and overview data.
    
    Args:
        limit: Number of articles
    
    Returns:
        DeFi news articles
    """
    response = requests.get(f"{BASE_URL}/api/defi", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/defi/summary - DeFi Market Summary
# =============================================================================

def get_defi_summary() -> dict:
    """
    Get DeFi market summary with TVL, volume, and top protocols.
    
    Returns:
        DeFi market summary
    """
    response = requests.get(f"{BASE_URL}/api/defi/summary")
    return response.json()


# =============================================================================
# GET /api/defi/protocol-health - Protocol Health Scores
# =============================================================================

def get_protocol_health(protocol: Optional[str] = None) -> dict:
    """
    Get DeFi protocol health scores and risk metrics.
    
    Args:
        protocol: Filter by protocol name
    
    Returns:
        Protocol health data with risk scores
    """
    params = {}
    if protocol:
        params["protocol"] = protocol
    
    response = requests.get(f"{BASE_URL}/api/defi/protocol-health", params=params)
    return response.json()


# =============================================================================
# GET /api/defi/yields - DeFi Yield Opportunities
# =============================================================================

def get_defi_yields(chain: Optional[str] = None, 
                    project: Optional[str] = None,
                    stablecoin: bool = False) -> dict:
    """
    Get DeFi yield opportunities.
    
    Args:
        chain: Filter by chain (ethereum, arbitrum, etc.)
        project: Filter by project (aave, compound, etc.)
        stablecoin: Only show stablecoin pools
    
    Returns:
        Yield opportunities with APY data
    """
    params = {}
    if chain:
        params["chain"] = chain
    if project:
        params["project"] = project
    if stablecoin:
        params["stablecoin"] = "true"
    
    response = requests.get(f"{BASE_URL}/api/defi/yields", params=params)
    return response.json()


# =============================================================================
# GET /api/defi/yields/stats - Yield Statistics
# =============================================================================

def get_yield_stats() -> dict:
    """
    Get aggregate yield statistics across DeFi.
    
    Returns:
        Yield statistics (median, mean, distribution)
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/stats")
    return response.json()


# =============================================================================
# GET /api/defi/yields/chains - Yields by Chain
# =============================================================================

def get_yields_by_chain() -> dict:
    """
    Get yield data broken down by blockchain.
    
    Returns:
        Per-chain yield data
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/chains")
    return response.json()


# =============================================================================
# GET /api/defi/yields/projects - Yields by Project
# =============================================================================

def get_yields_by_project() -> dict:
    """
    Get yield data broken down by DeFi project.
    
    Returns:
        Per-project yield data
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/projects")
    return response.json()


# =============================================================================
# GET /api/defi/yields/median - Median Yields
# =============================================================================

def get_median_yields() -> dict:
    """
    Get median yield rates across DeFi protocols.
    
    Returns:
        Median yield data
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/median")
    return response.json()


# =============================================================================
# GET /api/defi/yields/stablecoins - Stablecoin Yields
# =============================================================================

def get_stablecoin_yields() -> dict:
    """
    Get yields specifically for stablecoin pools.
    
    Returns:
        Stablecoin yield opportunities
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/stablecoins")
    return response.json()


# =============================================================================
# GET /api/defi/yields/search - Search Yields
# =============================================================================

def search_yields(query: str) -> dict:
    """
    Search for specific yield opportunities.
    
    Args:
        query: Search query (e.g., 'USDC', 'Aave')
    
    Returns:
        Matching yield opportunities
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/search", params={"q": query})
    return response.json()


# =============================================================================
# GET /api/defi/yields/[poolId]/chart - Pool Chart Data
# =============================================================================

def get_pool_chart(pool_id: str) -> dict:
    """
    Get historical yield chart data for a specific pool.
    
    Args:
        pool_id: Pool identifier
    
    Returns:
        Historical yield chart data
    """
    response = requests.get(f"{BASE_URL}/api/defi/yields/{pool_id}/chart")
    return response.json()


# =============================================================================
# GET /api/defi/stablecoins - DeFi Stablecoin Data
# =============================================================================

def get_defi_stablecoins() -> dict:
    """
    Get stablecoin data within DeFi context.
    
    Returns:
        Stablecoin market data
    """
    response = requests.get(f"{BASE_URL}/api/defi/stablecoins")
    return response.json()


# =============================================================================
# GET /api/defi/bridges - Bridge Data
# =============================================================================

def get_defi_bridges() -> dict:
    """
    Get cross-chain bridge volumes and TVL.
    
    Returns:
        Bridge data with volumes
    """
    response = requests.get(f"{BASE_URL}/api/defi/bridges")
    return response.json()


# =============================================================================
# GET /api/defi/dex-volumes - DEX Trading Volumes
# =============================================================================

def get_dex_volumes() -> dict:
    """
    Get DEX trading volumes across chains.
    
    Returns:
        DEX volume data
    """
    response = requests.get(f"{BASE_URL}/api/defi/dex-volumes")
    return response.json()


# =============================================================================
# GET /api/stablecoins - Stablecoin Overview
# =============================================================================

def get_stablecoins() -> dict:
    """
    Get comprehensive stablecoin market data.
    
    Returns:
        Stablecoin market overview
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins")
    return response.json()


# =============================================================================
# GET /api/stablecoins/[symbol] - Individual Stablecoin
# =============================================================================

def get_stablecoin(symbol: str) -> dict:
    """
    Get data for a specific stablecoin.
    
    Args:
        symbol: Stablecoin symbol (USDT, USDC, DAI, etc.)
    
    Returns:
        Stablecoin details
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins/{symbol}")
    return response.json()


# =============================================================================
# GET /api/stablecoins/depeg - Depeg Monitoring
# =============================================================================

def get_stablecoin_depeg() -> dict:
    """
    Monitor stablecoins for depeg events.
    
    Returns:
        Current depeg status and alerts
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins/depeg")
    return response.json()


# =============================================================================
# GET /api/stablecoins/dominance - Market Dominance
# =============================================================================

def get_stablecoin_dominance() -> dict:
    """
    Get stablecoin market share and dominance data.
    
    Returns:
        Dominance data by stablecoin
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins/dominance")
    return response.json()


# =============================================================================
# GET /api/stablecoins/flows - Capital Flows
# =============================================================================

def get_stablecoin_flows() -> dict:
    """
    Get stablecoin capital flow data.
    
    Returns:
        Mint/burn flows and exchange flows
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins/flows")
    return response.json()


# =============================================================================
# GET /api/stablecoins/chains - Chain Distribution
# =============================================================================

def get_stablecoin_chains() -> dict:
    """
    Get stablecoin distribution across chains.
    
    Returns:
        Per-chain stablecoin supply data
    """
    response = requests.get(f"{BASE_URL}/api/stablecoins/chains")
    return response.json()


# =============================================================================
# GET /api/dex-volumes - Global DEX Volumes
# =============================================================================

def get_global_dex_volumes() -> dict:
    """
    Get aggregate DEX trading volumes.
    
    Returns:
        Global DEX volume data
    """
    response = requests.get(f"{BASE_URL}/api/dex-volumes")
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - DEFI EXAMPLES")
    print("="*60)
    
    # 1. DeFi Overview
    print("\n🏦 1. DeFi News")
    defi = get_defi(limit=5)
    print(f"   DeFi: {defi}")
    
    # 2. DeFi Summary
    print("\n📊 2. DeFi Market Summary")
    summary = get_defi_summary()
    print(f"   Summary: {summary}")
    
    # 3. Protocol Health
    print("\n❤️ 3. Protocol Health")
    health = get_protocol_health()
    print(f"   Health: {health}")
    
    # 4. Yields
    print("\n💰 4. DeFi Yields (Ethereum)")
    yields = get_defi_yields(chain="ethereum")
    print(f"   Yields: {yields}")
    
    # 5. Yield Stats
    print("\n📈 5. Yield Statistics")
    stats = get_yield_stats()
    print(f"   Stats: {stats}")
    
    # 6. Yields by Chain
    print("\n🔗 6. Yields by Chain")
    chain_yields = get_yields_by_chain()
    print(f"   By Chain: {chain_yields}")
    
    # 7. Stablecoin Yields
    print("\n💵 7. Stablecoin Yields")
    stable_yields = get_stablecoin_yields()
    print(f"   Yields: {stable_yields}")
    
    # 8. Stablecoins
    print("\n🪙 8. Stablecoin Overview")
    stablecoins = get_stablecoins()
    print(f"   Stablecoins: {stablecoins}")
    
    # 9. Stablecoin Depeg
    print("\n⚠️ 9. Depeg Monitor")
    depeg = get_stablecoin_depeg()
    print(f"   Depeg: {depeg}")
    
    # 10. DEX Volumes
    print("\n📊 10. DEX Volumes")
    volumes = get_dex_volumes()
    print(f"   Volumes: {volumes}")
    
    # 11. Bridges
    print("\n🌉 11. Bridge Data")
    bridges = get_defi_bridges()
    print(f"   Bridges: {bridges}")
    
    # 12. Stablecoin Dominance
    print("\n🏆 12. Stablecoin Dominance")
    dominance = get_stablecoin_dominance()
    print(f"   Dominance: {dominance}")
    
    print("\n" + "="*60)
    print("All DeFi examples completed!")
    print("="*60)
