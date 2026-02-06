"""
LangChain Tool Example

Use crypto news as a tool in your AI agent.
pip install langchain langchain-openai
"""

from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
import requests

API_BASE = "https://cryptocurrency.cv"

@tool
def get_crypto_news(limit: int = 5) -> str:
    """Get the latest cryptocurrency news from 7 major sources."""
    response = requests.get(f"{API_BASE}/api/news?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']}, {article['timeAgo']})")
    
    return "\n".join(result) if result else "No news available."

@tool
def search_crypto_news(keywords: str, limit: int = 5) -> str:
    """Search crypto news by keywords. Use comma-separated terms."""
    response = requests.get(f"{API_BASE}/api/search?q={keywords}&limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\n".join(result) if result else f"No news found for '{keywords}'."

@tool
def get_defi_news(limit: int = 5) -> str:
    """Get DeFi-specific news about yield farming, DEXs, and protocols."""
    response = requests.get(f"{API_BASE}/api/defi?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\n".join(result) if result else "No DeFi news available."

@tool  
def get_bitcoin_news(limit: int = 5) -> str:
    """Get Bitcoin-specific news about BTC, mining, Lightning Network."""
    response = requests.get(f"{API_BASE}/api/bitcoin?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"• {article['title']} ({article['source']})")
    
    return "\n".join(result) if result else "No Bitcoin news available."

@tool
def get_breaking_news(limit: int = 5) -> str:
    """Get breaking crypto news from the last 2 hours."""
    response = requests.get(f"{API_BASE}/api/breaking?limit={limit}")
    data = response.json()
    
    result = []
    for article in data.get("articles", []):
        result.append(f"🚨 {article['title']} ({article['timeAgo']})")
    
    return "\n".join(result) if result else "No breaking news in the last 2 hours."


# Example agent setup
def create_news_agent():
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    tools = [
        get_crypto_news,
        search_crypto_news,
        get_defi_news,
        get_bitcoin_news,
        get_breaking_news,
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful crypto news assistant. Use the available tools to fetch real-time news."),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    agent = create_openai_functions_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)


if __name__ == "__main__":
    # Simple test
    print("Testing crypto news tools...\n")
    print("Latest News:")
    print(get_crypto_news.invoke({"limit": 3}))
    print("\nDeFi News:")
    print(get_defi_news.invoke({"limit": 3}))
