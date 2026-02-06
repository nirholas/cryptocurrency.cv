# LangChain Integration

Use Free Crypto News as a tool in LangChain agents for AI-powered crypto analysis.

## Features

- 🔧 Custom LangChain tool
- 🤖 Agent integration
- 📊 Market analysis chains
- 🔗 RAG with news context

## Installation

```bash
pip install langchain langchain-openai httpx
```

## Quick Start

### Basic Tool

```python
from langchain.tools import tool
import httpx

API_BASE = "https://cryptocurrency.cv/api"


@tool
def get_crypto_news(query: str = None, limit: int = 5) -> str:
    """
    Fetch the latest cryptocurrency news.
    
    Args:
        query: Optional search query to filter news
        limit: Number of articles to return (default 5)
    
    Returns:
        String containing news headlines and summaries
    """
    if query:
        url = f"{API_BASE}/search?q={query}&limit={limit}"
    else:
        url = f"{API_BASE}/news?limit={limit}"
    
    response = httpx.get(url)
    data = response.json()
    
    articles = data.get("articles", [])
    if not articles:
        return "No news found."
    
    result = []
    for article in articles:
        result.append(f"- {article['title']} ({article['source']}, {article['timeAgo']})")
        result.append(f"  {article['description'][:200]}...")
    
    return "\n".join(result)


@tool
def get_fear_greed_index() -> str:
    """
    Get the current Fear & Greed Index for the crypto market.
    
    Returns:
        String with the current index value and classification
    """
    response = httpx.get(f"{API_BASE}/fear-greed")
    data = response.json()
    
    return f"Fear & Greed Index: {data['value']} ({data['classification']})"


@tool
def get_market_data(coin: str = "bitcoin") -> str:
    """
    Get current price and market data for a cryptocurrency.
    
    Args:
        coin: The cryptocurrency to look up (e.g., 'bitcoin', 'ethereum')
    
    Returns:
        String with price, 24h change, and market cap
    """
    response = httpx.get(f"{API_BASE}/market/{coin}")
    data = response.json()
    
    return (
        f"{data['name']} ({data['symbol'].upper()})\n"
        f"Price: ${data['price']:,.2f}\n"
        f"24h Change: {data['change24h']:+.2f}%\n"
        f"Market Cap: ${data['marketCap']:,.0f}"
    )
```

## Agent Example

```python
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# Initialize LLM
llm = ChatOpenAI(model="gpt-4", temperature=0)

# Define tools
tools = [get_crypto_news, get_fear_greed_index, get_market_data]

# Create prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a cryptocurrency market analyst assistant. 
    Use the available tools to fetch real-time news and market data.
    Provide insightful analysis based on the data you retrieve."""),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create agent
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Run
response = agent_executor.invoke({
    "input": "What's the current market sentiment and any major news about Bitcoin?"
})
print(response["output"])
```

## RAG with News Context

Use news as context for question answering:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA


def create_news_rag():
    """Create a RAG chain with crypto news context."""
    
    # Fetch recent news
    response = httpx.get(f"{API_BASE}/news?limit=50")
    articles = response.json()["articles"]
    
    # Prepare documents
    documents = []
    for article in articles:
        content = f"{article['title']}\n\n{article['description']}"
        metadata = {
            "source": article["source"],
            "url": article["link"],
            "date": article["pubDate"],
        }
        documents.append(Document(page_content=content, metadata=metadata))
    
    # Split documents
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = splitter.split_documents(documents)
    
    # Create vector store
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(splits, embeddings)
    
    # Create retrieval chain
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    )
    
    return qa_chain


# Usage
rag = create_news_rag()
answer = rag.invoke("What are the latest developments in DeFi?")
print(answer["result"])
```

## Analysis Chain

Chain multiple tools for comprehensive analysis:

```python
from langchain.chains import SequentialChain, LLMChain
from langchain.prompts import PromptTemplate


# News summary chain
news_prompt = PromptTemplate(
    input_variables=["topic"],
    template="Summarize the key points from this crypto news about {topic}:\n\n{news}",
)
news_chain = LLMChain(llm=llm, prompt=news_prompt, output_key="summary")


# Market analysis chain
analysis_prompt = PromptTemplate(
    input_variables=["summary", "market_data", "sentiment"],
    template="""
    Based on the following information, provide a market analysis:
    
    News Summary: {summary}
    Market Data: {market_data}
    Market Sentiment: {sentiment}
    
    Provide your analysis with:
    1. Current market state
    2. Key drivers
    3. Potential risks
    4. Short-term outlook
    """,
)
analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt, output_key="analysis")


# Combined analysis
async def full_analysis(topic: str):
    # Fetch data
    news = get_crypto_news(topic, 10)
    sentiment = get_fear_greed_index()
    market = get_market_data("bitcoin")
    
    # Run chains
    summary = news_chain.invoke({"topic": topic, "news": news})
    analysis = analysis_chain.invoke({
        "summary": summary["summary"],
        "market_data": market,
        "sentiment": sentiment,
    })
    
    return analysis["analysis"]
```

## Streaming Responses

```python
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    model="gpt-4",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()],
)

agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools)

# Responses stream to stdout
agent_executor.invoke({"input": "Give me a market update"})
```

## Custom Tool Class

For more control, create a proper tool class:

```python
from langchain.tools import BaseTool
from pydantic import BaseModel, Field


class CryptoNewsInput(BaseModel):
    query: str = Field(default=None, description="Search query for news")
    category: str = Field(default=None, description="News category filter")
    limit: int = Field(default=5, description="Number of articles")


class CryptoNewsTool(BaseTool):
    name = "crypto_news"
    description = "Fetch cryptocurrency news articles"
    args_schema = CryptoNewsInput
    
    def _run(self, query: str = None, category: str = None, limit: int = 5) -> str:
        params = {"limit": limit}
        if query:
            params["q"] = query
        if category:
            params["category"] = category
        
        response = httpx.get(f"{API_BASE}/news", params=params)
        data = response.json()
        
        return self._format_articles(data["articles"])
    
    def _format_articles(self, articles):
        return "\n".join([
            f"- {a['title']} ({a['source']})" 
            for a in articles
        ])
```

## Full Example

See the complete LangChain integration: [examples/langchain-tool.py](https://github.com/nirholas/free-crypto-news/blob/main/examples/langchain-tool.py)
