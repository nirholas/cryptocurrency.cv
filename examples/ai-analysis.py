#!/usr/bin/env python3
"""
AI Analysis Example for Free Crypto News API

Demonstrates using the AI endpoints to analyze crypto news.
"""

import json
import requests
from typing import Optional

API_URL = "https://cryptocurrency.cv"


def analyze_article(title: str, content: str, action: str, options: Optional[dict] = None) -> dict:
    """
    Analyze an article using the AI endpoint.
    
    Args:
        title: Article title
        content: Article content
        action: One of: summarize, sentiment, facts, factcheck, questions, categorize, translate
        options: Optional parameters (length for summarize, targetLanguage for translate)
    
    Returns:
        Analysis result
    """
    payload = {
        "action": action,
        "title": title,
        "content": content,
    }
    
    if options:
        payload["options"] = options
    
    response = requests.post(
        f"{API_URL}/api/ai",
        headers={"Content-Type": "application/json"},
        json=payload
    )
    
    return response.json()


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
    print("Free Crypto News - AI Analysis Examples")
    print("=" * 60)
    
    # 1. Summarize the article
    print("\n📝 SUMMARIZATION")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "summarize", {"length": "short"})
    if result.get("success"):
        print(f"Summary: {result['result']}")
    else:
        print(f"Error: {result.get('error')}")
    
    # 2. Sentiment Analysis
    print("\n📊 SENTIMENT ANALYSIS")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "sentiment")
    if result.get("success"):
        sentiment = result["result"]
        print(f"Sentiment: {sentiment['sentiment'].upper()}")
        print(f"Confidence: {sentiment['confidence'] * 100:.0f}%")
        print(f"Market Impact: {sentiment['marketImpact']}")
        print(f"Affected Assets: {', '.join(sentiment['affectedAssets'])}")
        print(f"Reasoning: {sentiment['reasoning']}")
    
    # 3. Fact Extraction
    print("\n🔍 FACT EXTRACTION")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "facts")
    if result.get("success"):
        facts = result["result"]
        
        print("Key Points:")
        for point in facts.get("keyPoints", []):
            print(f"  • {point}")
        
        print("\nEntities:")
        for entity in facts.get("entities", []):
            print(f"  • {entity['name']} ({entity['type']})")
        
        print("\nNumbers:")
        for num in facts.get("numbers", []):
            print(f"  • {num['value']}: {num['context']}")
    
    # 4. Fact Checking
    print("\n✅ FACT CHECK")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "factcheck")
    if result.get("success"):
        check = result["result"]
        print(f"Overall Credibility: {check['overallCredibility'].upper()}")
        
        print("\nClaims:")
        for claim in check.get("claims", []):
            emoji = {"verified": "✅", "unverified": "❓", "disputed": "⚠️", "false": "❌"}
            print(f"  {emoji.get(claim['verdict'], '•')} {claim['claim']}")
            print(f"     Verdict: {claim['verdict']} - {claim['explanation']}")
        
        if check.get("warnings"):
            print("\nWarnings:")
            for warning in check["warnings"]:
                print(f"  ⚠️ {warning}")
    
    # 5. Question Generation
    print("\n❓ FOLLOW-UP QUESTIONS")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "questions")
    if result.get("success"):
        for i, question in enumerate(result["result"], 1):
            print(f"  {i}. {question}")
    
    # 6. Categorization
    print("\n🏷️ CATEGORIZATION")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "categorize")
    if result.get("success"):
        cats = result["result"]
        print(f"Primary Category: {cats['primaryCategory']}")
        print(f"Secondary: {', '.join(cats.get('secondaryCategories', []))}")
        print(f"Tags: {', '.join(cats.get('tags', []))}")
        print(f"Topics: {', '.join(cats.get('topics', []))}")
    
    # 7. Translation
    print("\n🌍 TRANSLATION (Spanish)")
    print("-" * 40)
    
    result = analyze_article(sample_title, sample_content, "translate", {"targetLanguage": "Spanish"})
    if result.get("success"):
        print(result["result"][:500] + "...")
    
    print("\n" + "=" * 60)
    print("Analysis complete!")


if __name__ == "__main__":
    main()
