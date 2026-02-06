#!/usr/bin/env python3
"""
Regulatory & Compliance API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for regulatory and compliance-related endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/regulatory - Regulatory News
# =============================================================================

def get_regulatory_news(region: Optional[str] = None, 
                        limit: int = 20) -> dict:
    """
    Get regulatory and compliance news.
    
    Args:
        region: Filter by region (us, eu, asia, etc.)
        limit: Number of articles
    
    Returns:
        Regulatory news articles
    """
    params = {"limit": limit}
    if region:
        params["region"] = region
    
    response = requests.get(f"{BASE_URL}/api/regulatory", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/updates - Policy Updates
# =============================================================================

def get_policy_updates(country: Optional[str] = None) -> dict:
    """
    Get latest policy and regulation updates.
    
    Args:
        country: Filter by country code
    
    Returns:
        Policy updates
    """
    params = {}
    if country:
        params["country"] = country
    
    response = requests.get(f"{BASE_URL}/api/regulatory/updates", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/countries - Country Regulations
# =============================================================================

def get_country_regulations(country: str) -> dict:
    """
    Get regulatory status by country.
    
    Args:
        country: Country code
    
    Returns:
        Country's crypto regulations
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/countries/{country}")
    return response.json()


def get_all_countries() -> dict:
    """
    Get regulatory overview for all countries.
    
    Returns:
        All countries' regulatory status
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/countries")
    return response.json()


# =============================================================================
# GET /api/regulatory/etf - ETF News
# =============================================================================

def get_etf_news(type: Optional[str] = None) -> dict:
    """
    Get crypto ETF news and updates.
    
    Args:
        type: ETF type (bitcoin, ethereum, spot, futures)
    
    Returns:
        ETF news and filings
    """
    params = {}
    if type:
        params["type"] = type
    
    response = requests.get(f"{BASE_URL}/api/regulatory/etf", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/sec - SEC News
# =============================================================================

def get_sec_news(limit: int = 20) -> dict:
    """
    Get SEC crypto-related news.
    
    Args:
        limit: Number of articles
    
    Returns:
        SEC news and filings
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/sec", 
                           params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/regulatory/cftc - CFTC News
# =============================================================================

def get_cftc_news(limit: int = 20) -> dict:
    """
    Get CFTC crypto-related news.
    
    Args:
        limit: Number of articles
    
    Returns:
        CFTC news and filings
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/cftc", 
                           params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/regulatory/enforcement - Enforcement Actions
# =============================================================================

def get_enforcement_actions(agency: Optional[str] = None, 
                           limit: int = 20) -> dict:
    """
    Get regulatory enforcement actions.
    
    Args:
        agency: Filter by agency (SEC, CFTC, DOJ, etc.)
        limit: Number of actions
    
    Returns:
        Enforcement actions
    """
    params = {"limit": limit}
    if agency:
        params["agency"] = agency
    
    response = requests.get(f"{BASE_URL}/api/regulatory/enforcement", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/legislation - Legislation Tracking
# =============================================================================

def get_legislation(status: Optional[str] = None, 
                    country: Optional[str] = None) -> dict:
    """
    Track crypto legislation.
    
    Args:
        status: Filter by status (proposed, passed, enacted)
        country: Filter by country
    
    Returns:
        Legislation tracking data
    """
    params = {}
    if status:
        params["status"] = status
    if country:
        params["country"] = country
    
    response = requests.get(f"{BASE_URL}/api/regulatory/legislation", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/cbdc - CBDC News
# =============================================================================

def get_cbdc_news(country: Optional[str] = None) -> dict:
    """
    Get Central Bank Digital Currency news.
    
    Args:
        country: Filter by country
    
    Returns:
        CBDC news and developments
    """
    params = {}
    if country:
        params["country"] = country
    
    response = requests.get(f"{BASE_URL}/api/regulatory/cbdc", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/sanctions - Sanctions Updates
# =============================================================================

def get_sanctions(limit: int = 20) -> dict:
    """
    Get crypto-related sanctions updates.
    
    Args:
        limit: Number of updates
    
    Returns:
        Sanctions news
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/sanctions", 
                           params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/regulatory/exchanges - Exchange Regulations
# =============================================================================

def get_exchange_regulations(exchange: Optional[str] = None) -> dict:
    """
    Get exchange regulatory status.
    
    Args:
        exchange: Filter by exchange
    
    Returns:
        Exchange regulatory status
    """
    params = {}
    if exchange:
        params["exchange"] = exchange
    
    response = requests.get(f"{BASE_URL}/api/regulatory/exchanges", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/taxes - Tax Updates
# =============================================================================

def get_tax_updates(country: Optional[str] = None) -> dict:
    """
    Get crypto tax updates.
    
    Args:
        country: Filter by country
    
    Returns:
        Tax policy updates
    """
    params = {}
    if country:
        params["country"] = country
    
    response = requests.get(f"{BASE_URL}/api/regulatory/taxes", params=params)
    return response.json()


# =============================================================================
# GET /api/regulatory/stablecoins - Stablecoin Regulations
# =============================================================================

def get_stablecoin_regulations() -> dict:
    """
    Get stablecoin regulatory updates.
    
    Returns:
        Stablecoin regulations
    """
    response = requests.get(f"{BASE_URL}/api/regulatory/stablecoins")
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - REGULATORY EXAMPLES")
    print("="*60)
    
    # 1. Regulatory News
    print("\n⚖️ 1. Latest Regulatory News")
    reg_news = get_regulatory_news(limit=5)
    print(f"   News: {reg_news}")
    
    # 2. US Regulations
    print("\n🇺🇸 2. US Regulatory Updates")
    us = get_policy_updates(country="US")
    print(f"   US Updates: {us}")
    
    # 3. EU Regulations
    print("\n🇪🇺 3. EU Crypto Regulations")
    eu = get_country_regulations("EU")
    print(f"   EU: {eu}")
    
    # 4. ETF News
    print("\n📈 4. Bitcoin ETF News")
    etf = get_etf_news(type="bitcoin")
    print(f"   ETF: {etf}")
    
    # 5. SEC News
    print("\n🏛️ 5. SEC Crypto News")
    sec = get_sec_news(limit=5)
    print(f"   SEC: {sec}")
    
    # 6. CFTC News
    print("\n🏛️ 6. CFTC News")
    cftc = get_cftc_news(limit=5)
    print(f"   CFTC: {cftc}")
    
    # 7. Enforcement Actions
    print("\n⚡ 7. Enforcement Actions")
    enforcement = get_enforcement_actions(limit=5)
    print(f"   Enforcement: {enforcement}")
    
    # 8. Legislation
    print("\n📜 8. Crypto Legislation")
    legislation = get_legislation(status="proposed")
    print(f"   Legislation: {legislation}")
    
    # 9. CBDC News
    print("\n🏦 9. CBDC Developments")
    cbdc = get_cbdc_news()
    print(f"   CBDC: {cbdc}")
    
    # 10. Sanctions
    print("\n🚫 10. Sanctions Updates")
    sanctions = get_sanctions(limit=5)
    print(f"   Sanctions: {sanctions}")
    
    # 11. Exchange Regulations
    print("\n🔄 11. Exchange Regulations")
    exchanges = get_exchange_regulations()
    print(f"   Exchanges: {exchanges}")
    
    # 12. Tax Updates
    print("\n💰 12. Tax Updates")
    taxes = get_tax_updates(country="US")
    print(f"   Taxes: {taxes}")
    
    # 13. Stablecoin Regulations
    print("\n💵 13. Stablecoin Regulations")
    stablecoins = get_stablecoin_regulations()
    print(f"   Stablecoins: {stablecoins}")
    
    # 14. All Countries Overview
    print("\n🌍 14. Global Regulatory Overview")
    countries = get_all_countries()
    print(f"   Countries tracked: {len(countries) if isinstance(countries, list) else 'See response'}")
    
    print("\n" + "="*60)
    print("Regulatory examples completed!")
    print("="*60)
