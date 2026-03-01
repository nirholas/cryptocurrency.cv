#!/usr/bin/env python3

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
AI Analysis Example for Free Crypto News API

Demonstrates all AI-powered endpoints:
- Summarization, sentiment, fact extraction, fact-checking
- Natural language Q&A via /api/ask
- AI daily brief, debate, counter-arguments
- Narratives, entities, clickbait detection
- Content analysis and AI content detection

Setup:
    pip install requests

    python ai-analysis.py
"""

import json
import requests
from typing import Optional

API_URL = "https://cryptocurrency.cv"


def api_get(endpoint: str, params: dict | None = None) -> dict:
    """Make a GET request to the API."""
    try:
        response = requests.get(f"{API_URL}{endpoint}", params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def api_post(endpoint: str, payload: dict) -> dict:
    """Make a POST request to the API."""
    try:
        response = requests.post(
            f"{API_URL}{endpoint}",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def analyze_article(title: str, content: str, action: str, options: Optional[dict] = None) -> dict:
    """
    Analyze an article using the unified AI endpoint (/api/ai).

    Args:
        title: Article title
        content: Article content
        action: One of: summarize, sentiment, facts, factcheck, questions, categorize, translate
        options: Optional parameters (length for summarize, targetLanguage for translate)

    Returns:
        Analysis result
    """
    payload = {"action": action, "title": title, "content": content}
    if options:
        payload["options"] = options
    return api_post("/api/ai", payload)


def main():
    # Sample article for analysis
    sample_title = "Bitcoin ETF Approval Sends Price Soaring"
    sample_content = """
    The Securities and Exchange Commission (SEC) has officially approved the first
    spot Bitcoin exchange-traded fund (ETF) in the United States. This historic
    decision marks a major milestone for cryptocurrency adoption, as institutional
    investors can now gain Bitcoin exposure through traditional brokerage accounts.

    Bitcoin's price surged 15% following the announcement, reaching $98,500.
    BlackRock and Fidelity are among the first to launch their Bitcoin ETF products.
    Trading volume hit $10 billion in the first hour alone.

    Industry experts predict this could bring billions of dollars in new investment
    to the cryptocurrency market over the coming months.
    """

    print("=" * 60)
    print("Free Crypto News — AI Analysis Examples")
    print("=" * 60)

    # ── 1. Summarization ──────────────────────────
    print("\n📝 SUMMARIZATION")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "summarize", {"length": "short"})
    if result.get("success"):
        print(f"Summary: {result['result']}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 2. Sentiment Analysis ─────────────────────
    print("\n📊 SENTIMENT ANALYSIS")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "sentiment")
    if result.get("success"):
        sentiment = result["result"]
        if isinstance(sentiment, dict):
            print(f"Sentiment: {sentiment.get('sentiment', 'N/A').upper()}")
            print(f"Confidence: {sentiment.get('confidence', 0) * 100:.0f}%")
            print(f"Market Impact: {sentiment.get('marketImpact', 'N/A')}")
            print(f"Affected Assets: {', '.join(sentiment.get('affectedAssets', []))}")
            print(f"Reasoning: {sentiment.get('reasoning', 'N/A')}")
        else:
            print(f"Result: {sentiment}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 3. Fact Extraction ────────────────────────
    print("\n🔍 FACT EXTRACTION")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "facts")
    if result.get("success"):
        facts = result["result"]
        if isinstance(facts, dict):
            print("Key Points:")
            for point in facts.get("keyPoints", []):
                print(f"  • {point}")
            print("\nEntities:")
            for entity in facts.get("entities", []):
                if isinstance(entity, dict):
                    print(f"  • {entity.get('name', '')} ({entity.get('type', '')})")
                else:
                    print(f"  • {entity}")
            print("\nNumbers:")
            for num in facts.get("numbers", []):
                if isinstance(num, dict):
                    print(f"  • {num.get('value', '')}: {num.get('context', '')}")
                else:
                    print(f"  • {num}")
        else:
            print(f"Result: {facts}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 4. Fact Checking ──────────────────────────
    print("\n✅ FACT CHECK")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "factcheck")
    if result.get("success"):
        check = result["result"]
        if isinstance(check, dict):
            print(f"Overall Credibility: {check.get('overallCredibility', 'N/A').upper()}")
            for claim in check.get("claims", []):
                if isinstance(claim, dict):
                    emoji = {"verified": "✅", "unverified": "❓", "disputed": "⚠️", "false": "❌"}
                    print(f"  {emoji.get(claim.get('verdict', ''), '•')} {claim.get('claim', '')}")
                    print(f"     Verdict: {claim.get('verdict', '')} — {claim.get('explanation', '')}")
        else:
            print(f"Result: {check}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 5. Question Generation ────────────────────
    print("\n❓ FOLLOW-UP QUESTIONS")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "questions")
    if result.get("success"):
        questions = result["result"]
        if isinstance(questions, list):
            for i, q in enumerate(questions, 1):
                print(f"  {i}. {q}")
        else:
            print(f"Result: {questions}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 6. Categorization ─────────────────────────
    print("\n🏷️ CATEGORIZATION")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "categorize")
    if result.get("success"):
        cats = result["result"]
        if isinstance(cats, dict):
            print(f"Primary: {cats.get('primaryCategory', 'N/A')}")
            print(f"Secondary: {', '.join(cats.get('secondaryCategories', []))}")
            print(f"Tags: {', '.join(cats.get('tags', []))}")
            print(f"Topics: {', '.join(cats.get('topics', []))}")
        else:
            print(f"Result: {cats}")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 7. Translation ────────────────────────────
    print("\n🌍 TRANSLATION (Spanish)")
    print("-" * 40)

    result = analyze_article(sample_title, sample_content, "translate", {"targetLanguage": "Spanish"})
    if result.get("success"):
        print(str(result["result"])[:500] + "...")
    else:
        print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 8. Ask AI (Natural Language Q&A) ──────────
    print("\n\n" + "=" * 60)
    print("AI Q&A — /api/ask Endpoint")
    print("=" * 60)

    questions = [
        "What is happening with Bitcoin ETFs?",
        "Which DeFi protocols have the highest TVL?",
        "What are the latest regulatory developments in crypto?",
    ]

    for q in questions:
        print(f"\n❓ Q: {q}")
        print("-" * 40)
        result = api_get("/api/ask", {"q": q})
        if result.get("answer"):
            print(f"💡 A: {result['answer'][:500]}")
        else:
            print(f"Response: {json.dumps(result, indent=2)[:500]}")

    # ── 9. AI Daily Brief ─────────────────────────
    print("\n\n" + "=" * 60)
    print("AI Daily Brief — /api/ai/brief")
    print("=" * 60)

    result = api_get("/api/ai/brief", {"format": "detailed"})
    print(json.dumps(result, indent=2)[:2000])

    # ── 10. AI Debate ─────────────────────────────
    print("\n\n" + "=" * 60)
    print("AI Debate — /api/ai/debate")
    print("=" * 60)

    result = api_post("/api/ai/debate", {"topic": "Will Bitcoin reach $200k in 2026?"})
    print(json.dumps(result, indent=2)[:2000])

    # ── 11. AI Counter-Argument ───────────────────
    print("\n\n" + "=" * 60)
    print("AI Counter-Argument — /api/ai/counter")
    print("=" * 60)

    result = api_post("/api/ai/counter", {
        "claim": "DeFi will replace traditional banking within 5 years",
        "context": "Recent regulatory crackdowns and smart contract exploits"
    })
    print(json.dumps(result, indent=2)[:2000])

    # ── 12. Sentiment Analysis (GET endpoint) ─────
    print("\n\n" + "=" * 60)
    print("Sentiment Analysis — /api/sentiment")
    print("=" * 60)

    for asset in ["bitcoin", "ethereum", "solana"]:
        result = api_get("/api/sentiment", {"asset": asset, "period": "24h"})
        print(f"\n{asset.upper()}:")
        print(json.dumps(result, indent=2)[:500])

    # ── 13. Narratives ────────────────────────────
    print("\n\n" + "=" * 60)
    print("Active Narratives — /api/narratives")
    print("=" * 60)

    result = api_get("/api/narratives")
    print(json.dumps(result, indent=2)[:2000])

    # ── 14. Entities ──────────────────────────────
    print("\n\n" + "=" * 60)
    print("Named Entities — /api/entities")
    print("=" * 60)

    result = api_get("/api/entities")
    print(json.dumps(result, indent=2)[:1000])

    # ── 15. Clickbait Detection ───────────────────
    print("\n\n" + "=" * 60)
    print("Clickbait Detection — /api/clickbait")
    print("=" * 60)

    result = api_get("/api/clickbait")
    print(json.dumps(result, indent=2)[:1000])

    # ── 16. AI Content Detection ──────────────────
    print("\n\n" + "=" * 60)
    print("AI Content Detection — /api/detect/ai-content")
    print("=" * 60)

    result = api_post("/api/detect/ai-content", {
        "content": "Bitcoin is a decentralized digital currency that operates on a peer-to-peer network."
    })
    print(json.dumps(result, indent=2)[:1000])

    # ── 17. Regulatory Updates ────────────────────
    print("\n\n" + "=" * 60)
    print("Regulatory Updates — /api/regulatory")
    print("=" * 60)

    result = api_get("/api/regulatory")
    print(json.dumps(result, indent=2)[:1000])

    # ── 18. Predictions ───────────────────────────
    print("\n\n" + "=" * 60)
    print("AI Predictions — /api/predictions")
    print("=" * 60)

    result = api_get("/api/predictions")
    print(json.dumps(result, indent=2)[:1000])

    print("\n" + "=" * 60)
    print("✅ Analysis complete!")


if __name__ == "__main__":
    main()
