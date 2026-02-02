"""
Free Crypto News API - Python Examples
https://github.com/nirholas/free-crypto-news

Complete Python SDK with examples for all 184 API endpoints.
"""

from .news import (
    get_news,
    get_international_news,
    extract_article,
    get_categories,
    get_bitcoin_news,
    get_defi_news,
    get_breaking_news,
    search_news,
    get_trending,
    get_sources,
    get_digest,
    get_tags,
    get_tag_articles,
)

from .ai import (
    ai_request,
    get_sentiment,
    analyze_text_sentiment,
    summarize_article,
    summarize_text,
    ask_ai,
    get_market_brief,
    ai_debate,
    get_counter_arguments,
    ai_agent,
    ai_agent_post,
    get_oracle_prediction,
    extract_entities,
    get_relationships,
    get_narratives,
    get_claims,
    detect_clickbait,
    factcheck,
    detect_ai_content,
    classify_article,
    get_origins,
)

from .market import (
    get_coins,
    get_ohlc,
    get_price_history,
    get_exchanges,
    get_exchange,
    get_derivatives,
    get_market_categories,
    get_category,
    search_markets,
    get_defi_market,
    compare_coins,
    get_coin_snapshot,
    get_coin_tickers,
    get_social_stats,
    get_orderbook,
    get_fear_greed,
)

from .trading import (
    get_arbitrage,
    get_signals,
    get_funding_rates,
    get_options,
    get_liquidations,
    get_whale_alerts,
    get_trading_orderbook,
    get_advanced_arbitrage,
    get_trading_options,
)

from .social import (
    get_x_feed,
    get_reddit_feed,
    get_youtube_feed,
    get_discord_activity,
    get_telegram_feed,
    get_github_activity,
    get_developer_activity,
    get_influencers,
    get_social_sentiment,
    get_social_trending,
    get_mentions,
    get_governance,
    get_proposal,
    get_events,
    get_calendar,
)

from .blockchain import (
    get_nft_news,
    get_onchain_data,
    get_gas_prices,
    get_token_holders,
    get_whale_movements,
    get_defi_tvl,
    get_tokens,
    get_token,
    get_staking,
    get_layer2_data,
    get_bridges,
    get_yields,
    get_airdrops,
    get_security_alerts,
    get_hacks,
    check_rugpull,
    get_audits,
)

from .regulatory import (
    get_regulatory_news,
    get_policy_updates,
    get_country_regulations,
    get_all_countries,
    get_etf_news,
    get_sec_news,
    get_cftc_news,
    get_enforcement_actions,
    get_legislation,
    get_cbdc_news,
    get_sanctions,
    get_exchange_regulations,
    get_tax_updates,
    get_stablecoin_regulations,
)

from .analytics import (
    get_analytics_overview,
    get_trends,
    get_coverage_analysis,
    get_sentiment_trends,
    get_source_analytics,
    get_news_volume,
    get_credibility,
    get_impact,
    get_correlations,
    get_heatmap,
    get_velocity,
    get_statistics,
    get_reports,
    get_report,
    get_timeline,
)

from .feeds import (
    get_rss_feed,
    get_rss_json,
    get_atom_feed,
    get_json_feed,
    export_data,
    export_csv,
    export_json,
    get_llms_txt,
    get_sitemap,
    get_oembed,
    get_embed_code,
    get_opml,
    get_archive,
)

from .portfolio import (
    get_portfolio,
    create_portfolio,
    add_holding,
    get_portfolio_performance,
    get_portfolio_news,
    get_alerts,
    create_alert,
    delete_alert,
    get_watchlist,
    add_to_watchlist,
    remove_from_watchlist,
    get_notifications,
    mark_notifications_read,
    get_preferences,
    update_preferences,
)

from .premium import (
    get_premium_status,
    get_premium_news,
    get_premium_analytics,
    get_premium_ai,
    create_webhook,
    bulk_export,
    get_historical,
    get_research,
    get_premium_signals,
    get_predictions,
    custom_analysis,
    get_realtime_token,
)

__version__ = "1.0.0"
__author__ = "Free Crypto News Team"
__all__ = [
    # News
    "get_news", "get_international_news", "extract_article", "get_categories",
    "get_bitcoin_news", "get_defi_news", "get_breaking_news", "search_news",
    "get_trending", "get_sources", "get_digest", "get_tags", "get_tag_articles",
    
    # AI
    "ai_request", "get_sentiment", "analyze_text_sentiment", "summarize_article",
    "summarize_text", "ask_ai", "get_market_brief", "ai_debate", "get_counter_arguments",
    "ai_agent", "ai_agent_post", "get_oracle_prediction", "extract_entities",
    "get_relationships", "get_narratives", "get_claims", "detect_clickbait",
    "factcheck", "detect_ai_content", "classify_article", "get_origins",
    
    # Market
    "get_coins", "get_ohlc", "get_price_history", "get_exchanges", "get_exchange",
    "get_derivatives", "get_market_categories", "get_category", "search_markets",
    "get_defi_market", "compare_coins", "get_coin_snapshot", "get_coin_tickers",
    "get_social_stats", "get_orderbook", "get_fear_greed",
    
    # Trading
    "get_arbitrage", "get_signals", "get_funding_rates", "get_options",
    "get_liquidations", "get_whale_alerts", "get_trading_orderbook",
    "get_advanced_arbitrage", "get_trading_options",
    
    # Social
    "get_x_feed", "get_reddit_feed", "get_youtube_feed", "get_discord_activity",
    "get_telegram_feed", "get_github_activity", "get_developer_activity",
    "get_influencers", "get_social_sentiment", "get_social_trending",
    "get_mentions", "get_governance", "get_proposal", "get_events", "get_calendar",
    
    # Blockchain
    "get_nft_news", "get_onchain_data", "get_gas_prices", "get_token_holders",
    "get_whale_movements", "get_defi_tvl", "get_tokens", "get_token",
    "get_staking", "get_layer2_data", "get_bridges", "get_yields",
    "get_airdrops", "get_security_alerts", "get_hacks", "check_rugpull", "get_audits",
    
    # Regulatory
    "get_regulatory_news", "get_policy_updates", "get_country_regulations",
    "get_all_countries", "get_etf_news", "get_sec_news", "get_cftc_news",
    "get_enforcement_actions", "get_legislation", "get_cbdc_news",
    "get_sanctions", "get_exchange_regulations", "get_tax_updates",
    "get_stablecoin_regulations",
    
    # Analytics
    "get_analytics_overview", "get_trends", "get_coverage_analysis",
    "get_sentiment_trends", "get_source_analytics", "get_news_volume",
    "get_credibility", "get_impact", "get_correlations", "get_heatmap",
    "get_velocity", "get_statistics", "get_reports", "get_report", "get_timeline",
    
    # Feeds
    "get_rss_feed", "get_rss_json", "get_atom_feed", "get_json_feed",
    "export_data", "export_csv", "export_json", "get_llms_txt",
    "get_sitemap", "get_oembed", "get_embed_code", "get_opml", "get_archive",
    
    # Portfolio
    "get_portfolio", "create_portfolio", "add_holding", "get_portfolio_performance",
    "get_portfolio_news", "get_alerts", "create_alert", "delete_alert",
    "get_watchlist", "add_to_watchlist", "remove_from_watchlist",
    "get_notifications", "mark_notifications_read", "get_preferences",
    "update_preferences",
    
    # Premium
    "get_premium_status", "get_premium_news", "get_premium_analytics",
    "get_premium_ai", "create_webhook", "bulk_export", "get_historical",
    "get_research", "get_premium_signals", "get_predictions",
    "custom_analysis", "get_realtime_token",
]
