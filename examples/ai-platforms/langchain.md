# LangChain Integration Guide

Complete guide for using Free Crypto News with LangChain (Python & JavaScript).

## What is LangChain?

[LangChain](https://langchain.com) is a framework for developing applications powered by language models, with tools, chains, agents, and memory.

---

## Integration Methods

| Method | Difficulty | Features | Best For |
|--------|------------|----------|----------|
| Custom Tool | ⭐⭐ Medium | Full API access | Agents |
| API Chain | ⭐ Easy | Simple requests | Chains |
| Document Loader | ⭐⭐ Medium | RAG | Knowledge base |
| Toolkit | ⭐⭐⭐ Advanced | Multiple tools | Complex agents |

---

## Method 1: Custom Tools (Python)

### Installation

```bash
pip install langchain langchain-openai langchain-anthropic requests
```

### Basic Tool

```python
"""
Free Crypto News LangChain Tools
"""

from typing import Optional
from langchain.tools import BaseTool, tool
from langchain.pydantic_v1 import BaseModel, Field
import requests


API_BASE = "https://cryptocurrency.cv"


class NewsInput(BaseModel):
    """Input for the news tool."""
    limit: int = Field(default=10, description="Number of articles (1-50)")
    category: Optional[str] = Field(default=None, description="Category: bitcoin, ethereum, defi, nft, regulation")


class SearchInput(BaseModel):
    """Input for the search tool."""
    query: str = Field(description="Search query")
    limit: int = Field(default=10, description="Number of results (1-50)")


class SentimentInput(BaseModel):
    """Input for sentiment analysis."""
    asset: str = Field(description="Asset symbol (e.g., BTC, ETH, SOL)")


@tool
def get_crypto_news(limit: int = 10, category: Optional[str] = None) -> str:
    """
    Get the latest cryptocurrency news articles.
    
    Args:
        limit: Number of articles to fetch (1-50)
        category: Filter by category (bitcoin, ethereum, defi, nft, regulation)
    
    Returns:
        Formatted news articles
    """
    params = {"limit": min(limit, 50)}
    if category:
        params["category"] = category
    
    try:
        response = requests.get(f"{API_BASE}/api/news", params=params, timeout=10)
        data = response.json()
        
        articles = data.get("articles", [])
        if not articles:
            return "No news articles found."
        
        result = []
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. {article.get('title', 'No title')}")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append(f"   Date: {article.get('publishedAt', 'Unknown')}")
            result.append(f"   Summary: {article.get('description', 'No description')[:200]}")
            result.append("")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error fetching news: {str(e)}"


@tool
def search_crypto_news(query: str, limit: int = 10) -> str:
    """
    Search cryptocurrency news by keywords.
    
    Args:
        query: Search query (e.g., "bitcoin etf", "ethereum upgrade")
        limit: Number of results (1-50)
    
    Returns:
        Search results
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/search",
            params={"q": query, "limit": min(limit, 50)},
            timeout=10
        )
        data = response.json()
        
        articles = data.get("articles", [])
        if not articles:
            return f"No results found for '{query}'."
        
        result = [f"Search results for '{query}':", ""]
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. {article.get('title', 'No title')}")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append("")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error searching news: {str(e)}"


@tool
def get_crypto_sentiment(asset: str) -> str:
    """
    Get AI sentiment analysis for a cryptocurrency.
    
    Args:
        asset: Asset symbol (e.g., BTC, ETH, SOL, XRP, DOGE)
    
    Returns:
        Sentiment analysis with score and confidence
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/ai/sentiment",
            params={"asset": asset.upper()},
            timeout=10
        )
        data = response.json()
        
        score = data.get("score", 0)
        label = data.get("label", "neutral")
        confidence = data.get("confidence", 0)
        
        return f"""
Sentiment Analysis for {asset.upper()}:
- Label: {label.title()}
- Score: {score:.2f} (range: -1 to 1)
- Confidence: {confidence:.1%}
- Interpretation: {"Bullish signal" if score > 0.3 else "Bearish signal" if score < -0.3 else "Neutral/mixed signal"}
"""
    except Exception as e:
        return f"Error getting sentiment: {str(e)}"


@tool
def get_fear_greed_index() -> str:
    """
    Get the Crypto Fear & Greed Index.
    
    Returns:
        Current Fear & Greed Index value and interpretation
    """
    try:
        response = requests.get(f"{API_BASE}/api/market/fear-greed", timeout=10)
        data = response.json()
        
        value = data.get("value", 50)
        classification = data.get("classification", "Neutral")
        
        interpretation = ""
        if value <= 25:
            interpretation = "Extreme fear often indicates a potential buying opportunity as investors are overly pessimistic."
        elif value <= 45:
            interpretation = "Fear in the market. Prices may be undervalued."
        elif value <= 55:
            interpretation = "Neutral sentiment. Market is balanced."
        elif value <= 75:
            interpretation = "Greed in the market. Exercise caution."
        else:
            interpretation = "Extreme greed. Market may be overvalued and due for a correction."
        
        return f"""
Fear & Greed Index:
- Value: {value}/100
- Classification: {classification}
- Interpretation: {interpretation}
"""
    except Exception as e:
        return f"Error getting Fear & Greed: {str(e)}"


@tool
def get_trending_crypto() -> str:
    """
    Get trending cryptocurrency topics and hashtags.
    
    Returns:
        List of trending topics with mention counts and sentiment
    """
    try:
        response = requests.get(f"{API_BASE}/api/trending", timeout=10)
        data = response.json()
        
        topics = data.get("topics", [])
        if not topics:
            return "No trending topics found."
        
        result = ["Trending Crypto Topics:", ""]
        for topic in topics[:10]:
            name = topic.get("name", "Unknown")
            mentions = topic.get("mentions", 0)
            sentiment = topic.get("sentiment", "neutral")
            emoji = "🟢" if sentiment == "bullish" else "🔴" if sentiment == "bearish" else "🟡"
            result.append(f"{emoji} {name}: {mentions:,} mentions ({sentiment})")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error getting trending: {str(e)}"


@tool
def get_crypto_prices(limit: int = 10) -> str:
    """
    Get current cryptocurrency prices.
    
    Args:
        limit: Number of coins to fetch (1-100)
    
    Returns:
        Price list with 24h changes
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/coins",
            params={"limit": min(limit, 100)},
            timeout=10
        )
        data = response.json()
        
        coins = data.get("coins", [])
        if not coins:
            return "No price data available."
        
        result = ["Cryptocurrency Prices:", ""]
        for coin in coins[:limit]:
            symbol = coin.get("symbol", "???").upper()
            price = coin.get("price", 0)
            change = coin.get("priceChange24h", 0)
            emoji = "📈" if change >= 0 else "📉"
            result.append(f"{symbol}: ${price:,.2f} {emoji} {change:+.2f}%")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error getting prices: {str(e)}"


@tool
def get_whale_alerts(min_value: int = 1000000) -> str:
    """
    Get recent whale (large) transaction alerts.
    
    Args:
        min_value: Minimum USD value for transactions (default: 1,000,000)
    
    Returns:
        Recent whale movements
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/trading/whales",
            params={"minValue": min_value},
            timeout=10
        )
        data = response.json()
        
        alerts = data.get("alerts", [])
        if not alerts:
            return "No recent whale movements detected."
        
        result = [f"Whale Alerts (>= ${min_value:,}):", ""]
        for alert in alerts[:10]:
            token = alert.get("token", "???")
            amount = alert.get("amountUSD", 0)
            from_addr = alert.get("from", "Unknown")[:10]
            to_addr = alert.get("to", "Unknown")[:10]
            result.append(f"🐋 {token}: ${amount:,.0f}")
            result.append(f"   {from_addr}... → {to_addr}...")
            result.append("")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error getting whale alerts: {str(e)}"


@tool
def get_arbitrage_opportunities() -> str:
    """
    Get cross-exchange arbitrage opportunities.
    
    Returns:
        Current arbitrage opportunities with spreads
    """
    try:
        response = requests.get(f"{API_BASE}/api/trading/arbitrage", timeout=10)
        data = response.json()
        
        opportunities = data.get("opportunities", [])
        if not opportunities:
            return "No significant arbitrage opportunities found."
        
        result = ["Arbitrage Opportunities:", ""]
        for opp in opportunities[:10]:
            pair = opp.get("pair", "???")
            buy = opp.get("buyExchange", "???")
            sell = opp.get("sellExchange", "???")
            spread = opp.get("spreadPercent", 0)
            result.append(f"💱 {pair}: {spread:.2f}%")
            result.append(f"   Buy @ {buy} → Sell @ {sell}")
            result.append("")
        
        result.append("⚠️ Note: Spreads don't account for fees. Verify before trading.")
        return "\n".join(result)
    except Exception as e:
        return f"Error getting arbitrage: {str(e)}"


# Collect all tools
CRYPTO_TOOLS = [
    get_crypto_news,
    search_crypto_news,
    get_crypto_sentiment,
    get_fear_greed_index,
    get_trending_crypto,
    get_crypto_prices,
    get_whale_alerts,
    get_arbitrage_opportunities,
]
```

### Using with LangChain Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

# Import the tools
from crypto_tools import CRYPTO_TOOLS

# Initialize LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Create prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a cryptocurrency market analyst assistant.
You have access to real-time crypto news, sentiment analysis, and market data.
Always provide balanced analysis and never give financial advice.
When asked about the market, use multiple tools to give comprehensive answers."""),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

# Create agent
agent = create_tool_calling_agent(llm, CRYPTO_TOOLS, prompt)
agent_executor = AgentExecutor(agent=agent, tools=CRYPTO_TOOLS, verbose=True)

# Run queries
result = agent_executor.invoke({
    "input": "Give me a complete market overview with sentiment analysis for BTC and ETH"
})
print(result["output"])
```

---

## Method 2: LangChain.js (JavaScript/TypeScript)

### Installation

```bash
npm install langchain @langchain/openai @langchain/core
```

### Tools in JavaScript

```typescript
// crypto-tools.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const API_BASE = "https://cryptocurrency.cv";

async function fetchApi(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });
  
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export const getCryptoNews = new DynamicStructuredTool({
  name: "get_crypto_news",
  description: "Get the latest cryptocurrency news articles",
  schema: z.object({
    limit: z.number().min(1).max(50).default(10).describe("Number of articles"),
    category: z.string().optional().describe("Category: bitcoin, ethereum, defi, nft, regulation"),
  }),
  func: async ({ limit, category }) => {
    const data = await fetchApi("/api/news", { limit, category });
    return data.articles
      .map((a: any, i: number) => `${i + 1}. ${a.title} (${a.source})`)
      .join("\n");
  },
});

export const searchCryptoNews = new DynamicStructuredTool({
  name: "search_crypto_news",
  description: "Search cryptocurrency news by keywords",
  schema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().min(1).max(50).default(10),
  }),
  func: async ({ query, limit }) => {
    const data = await fetchApi("/api/search", { q: query, limit });
    return data.articles
      .map((a: any, i: number) => `${i + 1}. ${a.title}`)
      .join("\n");
  },
});

export const getCryptoSentiment = new DynamicStructuredTool({
  name: "get_crypto_sentiment",
  description: "Get AI sentiment analysis for a cryptocurrency",
  schema: z.object({
    asset: z.string().describe("Asset symbol (BTC, ETH, SOL, etc.)"),
  }),
  func: async ({ asset }) => {
    const data = await fetchApi("/api/ai/sentiment", { asset: asset.toUpperCase() });
    return `${asset.toUpperCase()} Sentiment: ${data.label} (score: ${data.score.toFixed(2)}, confidence: ${(data.confidence * 100).toFixed(0)}%)`;
  },
});

export const getFearGreedIndex = new DynamicStructuredTool({
  name: "get_fear_greed_index",
  description: "Get the Crypto Fear & Greed Index",
  schema: z.object({}),
  func: async () => {
    const data = await fetchApi("/api/market/fear-greed");
    return `Fear & Greed Index: ${data.value}/100 (${data.classification})`;
  },
});

export const getTrendingCrypto = new DynamicStructuredTool({
  name: "get_trending_crypto",
  description: "Get trending cryptocurrency topics",
  schema: z.object({}),
  func: async () => {
    const data = await fetchApi("/api/trending");
    return data.topics
      .slice(0, 10)
      .map((t: any) => `${t.name}: ${t.mentions} mentions (${t.sentiment})`)
      .join("\n");
  },
});

export const getCryptoPrices = new DynamicStructuredTool({
  name: "get_crypto_prices",
  description: "Get current cryptocurrency prices",
  schema: z.object({
    limit: z.number().min(1).max(100).default(10),
  }),
  func: async ({ limit }) => {
    const data = await fetchApi("/api/coins", { limit });
    return data.coins
      .map((c: any) => `${c.symbol}: $${c.price.toLocaleString()} (${c.priceChange24h >= 0 ? '+' : ''}${c.priceChange24h.toFixed(2)}%)`)
      .join("\n");
  },
});

export const CRYPTO_TOOLS = [
  getCryptoNews,
  searchCryptoNews,
  getCryptoSentiment,
  getFearGreedIndex,
  getTrendingCrypto,
  getCryptoPrices,
];
```

### Agent with JavaScript

```typescript
// agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CRYPTO_TOOLS } from "./crypto-tools";

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a cryptocurrency analyst with access to real-time market data.
Use the tools to provide accurate, up-to-date information.
Never give financial advice. Always cite data sources.`],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createToolCallingAgent({
  llm,
  tools: CRYPTO_TOOLS,
  prompt,
});

const executor = new AgentExecutor({
  agent,
  tools: CRYPTO_TOOLS,
  verbose: true,
});

// Run
const result = await executor.invoke({
  input: "What's the current market sentiment and any breaking news about Bitcoin?",
});

console.log(result.output);
```

---

## Method 3: LangGraph Agent

For more complex, stateful agents:

```python
from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI

from crypto_tools import CRYPTO_TOOLS

# Define state
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], "The messages in the conversation"]

# Create LLM with tools
llm = ChatOpenAI(model="gpt-4o").bind_tools(CRYPTO_TOOLS)

# Define agent node
def agent(state: AgentState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# Define should_continue
def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent)
workflow.add_node("tools", ToolNode(CRYPTO_TOOLS))
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")

# Compile
app = workflow.compile()

# Run
from langchain_core.messages import HumanMessage

result = app.invoke({
    "messages": [HumanMessage(content="Analyze the current crypto market conditions")]
})

print(result["messages"][-1].content)
```

---

## Method 4: Document Loader for RAG

```python
from langchain.document_loaders.base import BaseLoader
from langchain.schema import Document
import requests
from typing import List

class CryptoNewsLoader(BaseLoader):
    """Load crypto news as documents for RAG."""
    
    def __init__(
        self,
        query: str = None,
        category: str = None,
        limit: int = 50,
        api_base: str = "https://cryptocurrency.cv"
    ):
        self.query = query
        self.category = category
        self.limit = limit
        self.api_base = api_base
    
    def load(self) -> List[Document]:
        """Load news articles as documents."""
        if self.query:
            endpoint = "/api/search"
            params = {"q": self.query, "limit": self.limit}
        else:
            endpoint = "/api/news"
            params = {"limit": self.limit}
            if self.category:
                params["category"] = self.category
        
        response = requests.get(f"{self.api_base}{endpoint}", params=params)
        data = response.json()
        
        documents = []
        for article in data.get("articles", []):
            content = f"{article.get('title', '')}\n\n{article.get('description', '')}"
            metadata = {
                "source": article.get("source", "unknown"),
                "url": article.get("url", ""),
                "published_at": article.get("publishedAt", ""),
                "category": article.get("category", ""),
            }
            documents.append(Document(page_content=content, metadata=metadata))
        
        return documents


# Usage with RAG
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# Load documents
loader = CryptoNewsLoader(limit=100)
documents = loader.load()

# Create vector store
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(documents, embeddings)

# Create retrieval chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o"),
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
)

# Query
result = qa_chain.invoke("What are the latest developments in Ethereum?")
print(result["result"])
```

---

## Method 5: Toolkit

Bundle all tools into a reusable toolkit:

```python
from langchain.agents import AgentType, initialize_agent
from langchain_core.tools import BaseToolkit
from typing import List
from langchain_core.tools import BaseTool

class CryptoNewsToolkit(BaseToolkit):
    """Toolkit for Free Crypto News API."""
    
    api_base: str = "https://cryptocurrency.cv"
    
    def get_tools(self) -> List[BaseTool]:
        """Get all crypto tools."""
        # Import tools with the correct API base
        from crypto_tools import CRYPTO_TOOLS
        return CRYPTO_TOOLS

# Usage
toolkit = CryptoNewsToolkit()
tools = toolkit.get_tools()

agent = initialize_agent(
    tools=tools,
    llm=ChatOpenAI(model="gpt-4o"),
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

agent.run("What's the current Fear & Greed Index and what does it mean?")
```

---

## Example Conversations

### Market Analysis Agent

```python
agent_executor.invoke({
    "input": """Perform a complete market analysis:
    1. Get the Fear & Greed Index
    2. Check sentiment for BTC, ETH, and SOL
    3. Look for any breaking news
    4. Identify trending topics
    5. Summarize the overall market conditions"""
})
```

### Trading Signal Bot

```python
agent_executor.invoke({
    "input": """Check for trading opportunities:
    1. Find any arbitrage opportunities
    2. Check whale movements
    3. Analyze sentiment for top 3 coins
    4. Provide a risk assessment"""
})
```

---

## Links

- **LangChain Python:** https://python.langchain.com
- **LangChain JS:** https://js.langchain.com
- **LangGraph:** https://langchain-ai.github.io/langgraph/
- **LangSmith:** https://smith.langchain.com
- **Free Crypto News API:** https://cryptocurrency.cv
