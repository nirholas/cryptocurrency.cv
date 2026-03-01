#!/usr/bin/env python3

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
Macro & Economic API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for macroeconomic data endpoints that provide context
for crypto market movements.
"""

import requests
import json
from typing import Optional

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/macro - Macro Overview
# =============================================================================

def get_macro() -> dict:
    """
    Get macroeconomic overview with key indicators.
    
    Returns:
        Macro economic overview
    """
    response = requests.get(f"{BASE_URL}/api/macro")
    return response.json()


# =============================================================================
# GET /api/macro/indicators - Economic Indicators
# =============================================================================

def get_indicators(indicator: Optional[str] = None) -> dict:
    """
    Get economic indicators (CPI, employment, GDP, etc).
    
    Args:
        indicator: Specific indicator name
    
    Returns:
        Economic indicator data
    """
    params = {}
    if indicator:
        params["indicator"] = indicator
    
    response = requests.get(f"{BASE_URL}/api/macro/indicators", params=params)
    return response.json()


# =============================================================================
# GET /api/macro/fed - Federal Reserve Data
# =============================================================================

def get_fed_data() -> dict:
    """
    Get Federal Reserve related data (rates, FOMC decisions).
    
    Returns:
        Fed data and rate decisions
    """
    response = requests.get(f"{BASE_URL}/api/macro/fed")
    return response.json()


# =============================================================================
# GET /api/macro/dxy - Dollar Index
# =============================================================================

def get_dxy() -> dict:
    """
    Get US Dollar Index (DXY) data.
    
    Returns:
        DXY price and trend data
    """
    response = requests.get(f"{BASE_URL}/api/macro/dxy")
    return response.json()


# =============================================================================
# GET /api/macro/correlations - Asset Correlations
# =============================================================================

def get_macro_correlations(asset: str = "BTC") -> dict:
    """
    Get correlations between crypto and macro assets.
    
    Args:
        asset: Crypto asset to correlate
    
    Returns:
        Correlation data with equities, commodities, etc.
    """
    response = requests.get(
        f"{BASE_URL}/api/macro/correlations", params={"asset": asset}
    )
    return response.json()


# =============================================================================
# GET /api/macro/risk-appetite - Risk Appetite Index
# =============================================================================

def get_risk_appetite() -> dict:
    """
    Get market risk appetite indicator.
    
    Returns:
        Risk appetite index and components
    """
    response = requests.get(f"{BASE_URL}/api/macro/risk-appetite")
    return response.json()


# =============================================================================
# GET /api/exchange-rates - Fiat Exchange Rates
# =============================================================================

def get_exchange_rates() -> dict:
    """
    Get fiat currency exchange rates.
    
    Returns:
        Exchange rates against USD
    """
    response = requests.get(f"{BASE_URL}/api/exchange-rates")
    return response.json()


# =============================================================================
# GET /api/exchange-rates/convert - Currency Conversion
# =============================================================================

def convert_currency(from_currency: str, to_currency: str, 
                     amount: float) -> dict:
    """
    Convert between currencies.
    
    Args:
        from_currency: Source currency (BTC, USD, EUR, etc.)
        to_currency: Target currency
        amount: Amount to convert
    
    Returns:
        Conversion result
    """
    params = {
        "from": from_currency,
        "to": to_currency,
        "amount": amount
    }
    response = requests.get(f"{BASE_URL}/api/exchange-rates/convert", params=params)
    return response.json()


# =============================================================================
# GET /api/global - Global Market Data
# =============================================================================

def get_global_data() -> dict:
    """
    Get global crypto market data (total market cap, volume, BTC dominance).
    
    Returns:
        Global market data
    """
    response = requests.get(f"{BASE_URL}/api/global")
    return response.json()


# =============================================================================
# GET /api/predictions - Price Predictions
# =============================================================================

def get_predictions(asset: Optional[str] = None) -> dict:
    """
    Get AI-powered price predictions.
    
    Args:
        asset: Filter by asset
    
    Returns:
        Price predictions with confidence scores
    """
    params = {}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/predictions", params=params)
    return response.json()


# =============================================================================
# GET /api/predictions/history - Historical Predictions
# =============================================================================

def get_prediction_history(asset: Optional[str] = None) -> dict:
    """
    Get historical prediction accuracy.
    
    Args:
        asset: Filter by asset
    
    Returns:
        Past predictions and their outcomes
    """
    params = {}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/predictions/history", params=params)
    return response.json()


# =============================================================================
# GET /api/predictions/markets - Prediction Markets
# =============================================================================

def get_prediction_markets() -> dict:
    """
    Get prediction market data.
    
    Returns:
        Active prediction markets
    """
    response = requests.get(f"{BASE_URL}/api/predictions/markets")
    return response.json()


# =============================================================================
# GET /api/forecast - Market Forecast
# =============================================================================

def get_forecast(asset: str = "BTC", horizon: str = "7d") -> dict:
    """
    Get market forecasts.
    
    Args:
        asset: Asset to forecast
        horizon: Forecast horizon (1d, 7d, 30d)
    
    Returns:
        Price forecast data
    """
    response = requests.get(
        f"{BASE_URL}/api/forecast", 
        params={"asset": asset, "horizon": horizon}
    )
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - MACRO & ECONOMIC EXAMPLES")
    print("="*60)
    
    # 1. Macro Overview
    print("\n🌍 1. Macro Overview")
    macro = get_macro()
    print(f"   Macro: {macro}")
    
    # 2. Fed Data
    print("\n🏛️ 2. Federal Reserve Data")
    fed = get_fed_data()
    print(f"   Fed: {fed}")
    
    # 3. DXY
    print("\n💲 3. Dollar Index (DXY)")
    dxy = get_dxy()
    print(f"   DXY: {dxy}")
    
    # 4. Correlations
    print("\n📊 4. BTC-Macro Correlations")
    corr = get_macro_correlations("BTC")
    print(f"   Correlations: {corr}")
    
    # 5. Risk Appetite
    print("\n🎯 5. Risk Appetite")
    risk = get_risk_appetite()
    print(f"   Risk: {risk}")
    
    # 6. Exchange Rates
    print("\n💱 6. Exchange Rates")
    rates = get_exchange_rates()
    print(f"   Rates: {rates}")
    
    # 7. Convert
    print("\n🔄 7. Convert 1 BTC to USD")
    conversion = convert_currency("BTC", "USD", 1)
    print(f"   Result: {conversion}")
    
    # 8. Global Data
    print("\n🌐 8. Global Market Data")
    global_data = get_global_data()
    print(f"   Global: {global_data}")
    
    # 9. Predictions
    print("\n🔮 9. BTC Price Predictions")
    predictions = get_predictions(asset="BTC")
    print(f"   Predictions: {predictions}")
    
    # 10. Forecast
    print("\n📈 10. Market Forecast")
    forecast = get_forecast(asset="BTC", horizon="7d")
    print(f"   Forecast: {forecast}")
    
    print("\n" + "="*60)
    print("All macro & economic examples completed!")
    print("="*60)
