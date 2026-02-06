/**
 * 🔊 Alexa Skill Handler
 * 
 * Voice-activated crypto news for Amazon Alexa.
 * "Alexa, ask Crypto News for the latest Bitcoin news"
 * 
 * POST /api/alexa - Alexa skill endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';

interface AlexaRequest {
  version: string;
  request: {
    type: string;
    requestId: string;
    intent?: {
      name: string;
      slots?: { [key: string]: { value: string } };
    };
  };
  session: {
    sessionId: string;
    application: { applicationId: string };
    user: { userId: string };
  };
}

interface AlexaResponse {
  version: string;
  response: {
    outputSpeech?: {
      type: 'PlainText' | 'SSML';
      text?: string;
      ssml?: string;
    };
    card?: {
      type: 'Simple' | 'Standard';
      title?: string;
      content?: string;
      text?: string;
      image?: {
        smallImageUrl?: string;
        largeImageUrl?: string;
      };
    };
    reprompt?: {
      outputSpeech: {
        type: 'PlainText';
        text: string;
      };
    };
    shouldEndSession: boolean;
  };
  sessionAttributes?: { [key: string]: any };
}

// Build Alexa response
function buildResponse(
  speech: string,
  cardTitle: string,
  cardContent: string,
  shouldEnd = true
): AlexaResponse {
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: speech,
      },
      card: {
        type: 'Simple',
        title: cardTitle,
        content: cardContent,
      },
      shouldEndSession: shouldEnd,
    },
  };
}

// Build SSML response for better speech
function buildSSMLResponse(
  ssml: string,
  cardTitle: string,
  cardContent: string,
  shouldEnd = true
): AlexaResponse {
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'SSML',
        ssml,
      },
      card: {
        type: 'Simple',
        title: cardTitle,
        content: cardContent,
      },
      shouldEndSession: shouldEnd,
    },
  };
}

// Handlers for different intents
async function handleLaunchRequest(): Promise<AlexaResponse> {
  return buildResponse(
    'Welcome to Crypto News! You can ask for the latest crypto news, Bitcoin updates, market sentiment, or the Fear and Greed Index. What would you like to know?',
    'Crypto News',
    'Ask for:\n- Latest news\n- Bitcoin news\n- Market sentiment\n- Fear and Greed Index',
    false
  );
}

async function handleLatestNewsIntent(coin?: string): Promise<AlexaResponse> {
  try {
    const endpoint = coin 
      ? `/api/search?q=${encodeURIComponent(coin)}&limit=3`
      : '/api/breaking?limit=3';
    
    const res = await fetch(`${API_BASE}${endpoint}`);
    const data = await res.json();
    const articles = data.articles || [];
    
    if (articles.length === 0) {
      return buildResponse(
        `I couldn't find any ${coin ? coin : ''} news right now. Try again later.`,
        'No News Found',
        'No articles available',
        true
      );
    }
    
    const headlines = articles.slice(0, 3).map((a: any, i: number) => 
      `${i + 1}. ${a.title}`
    );
    
    const speech = `Here are the top ${coin ? coin : 'crypto'} headlines. ${headlines.join('. ')}`;
    const card = headlines.join('\n');
    
    return buildSSMLResponse(
      `<speak>${speech}</speak>`,
      `${coin || 'Crypto'} News`,
      card,
      true
    );
  } catch (error) {
    return buildResponse(
      'Sorry, I had trouble getting the news. Please try again.',
      'Error',
      'Could not fetch news',
      true
    );
  }
}

async function handleMarketSentimentIntent(): Promise<AlexaResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/sentiment`);
    const data = await res.json();
    const market = data.market || { score: 50, label: 'Neutral' };
    
    const speech = `The current market sentiment is ${market.label} with a score of ${market.score} out of 100. ${market.bullish}% of articles are bullish, and ${market.bearish}% are bearish.`;
    
    return buildResponse(
      speech,
      'Market Sentiment',
      `Score: ${market.score}/100 - ${market.label}\nBullish: ${market.bullish}%\nBearish: ${market.bearish}%`,
      true
    );
  } catch (error) {
    return buildResponse(
      'Sorry, I could not get the market sentiment right now.',
      'Error',
      'Could not fetch sentiment',
      true
    );
  }
}

async function handleFearGreedIntent(): Promise<AlexaResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/fear-greed`);
    const data = await res.json();
    
    const value = data.value || 50;
    const label = data.classification || 'Neutral';
    
    let description = '';
    if (value < 25) description = 'Extreme fear in the market. This could be a buying opportunity.';
    else if (value < 40) description = 'Fear in the market. Investors are cautious.';
    else if (value < 60) description = 'Neutral sentiment. The market is undecided.';
    else if (value < 75) description = 'Greed in the market. Investors are optimistic.';
    else description = 'Extreme greed. Be careful of a potential correction.';
    
    const speech = `The Fear and Greed Index is at ${value}, indicating ${label}. ${description}`;
    
    return buildResponse(
      speech,
      'Fear & Greed Index',
      `Value: ${value}/100\nStatus: ${label}\n\n${description}`,
      true
    );
  } catch (error) {
    return buildResponse(
      'Sorry, I could not get the Fear and Greed Index.',
      'Error',
      'Could not fetch index',
      true
    );
  }
}

async function handlePriceIntent(coin: string): Promise<AlexaResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/prices`);
    const data = await res.json();
    const prices = data.prices || {};
    
    // Find the coin (case-insensitive)
    const coinKey = Object.keys(prices).find(k => 
      k.toLowerCase() === coin.toLowerCase() ||
      k.toLowerCase().includes(coin.toLowerCase())
    );
    
    if (!coinKey || !prices[coinKey]) {
      return buildResponse(
        `I don't have price data for ${coin}. Try asking for Bitcoin, Ethereum, or another major cryptocurrency.`,
        'Price Not Found',
        `Could not find ${coin}`,
        true
      );
    }
    
    const price = prices[coinKey];
    const usd = price.usd?.toLocaleString() || 'unknown';
    const change = price.change24h?.toFixed(2) || '0';
    const direction = parseFloat(change) >= 0 ? 'up' : 'down';
    
    const speech = `${coinKey} is currently at ${usd} dollars, ${direction} ${Math.abs(parseFloat(change))} percent in the last 24 hours.`;
    
    return buildResponse(
      speech,
      `${coinKey} Price`,
      `$${usd}\n24h Change: ${change}%`,
      true
    );
  } catch (error) {
    return buildResponse(
      `Sorry, I could not get the price for ${coin}.`,
      'Error',
      'Could not fetch price',
      true
    );
  }
}

async function handleHelpIntent(): Promise<AlexaResponse> {
  return buildResponse(
    'You can ask me for the latest crypto news, Bitcoin or Ethereum news, market sentiment, Fear and Greed Index, or the price of any cryptocurrency. What would you like to know?',
    'Help',
    'Available commands:\n- Latest news\n- Bitcoin news\n- Ethereum news\n- Market sentiment\n- Fear and Greed Index\n- Price of [coin]',
    false
  );
}

async function handleStopIntent(): Promise<AlexaResponse> {
  return buildResponse(
    'Goodbye! Stay crypto!',
    'Goodbye',
    'Thanks for using Crypto News!',
    true
  );
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    const alexaRequest: AlexaRequest = await request.json();
    const requestType = alexaRequest.request.type;
    
    let response: AlexaResponse;
    
    switch (requestType) {
      case 'LaunchRequest':
        response = await handleLaunchRequest();
        break;
        
      case 'IntentRequest':
        const intentName = alexaRequest.request.intent?.name;
        const slots = alexaRequest.request.intent?.slots || {};
        
        switch (intentName) {
          case 'LatestNewsIntent':
          case 'GetNewsIntent':
            response = await handleLatestNewsIntent(slots.coin?.value);
            break;
            
          case 'BitcoinNewsIntent':
            response = await handleLatestNewsIntent('Bitcoin');
            break;
            
          case 'EthereumNewsIntent':
            response = await handleLatestNewsIntent('Ethereum');
            break;
            
          case 'MarketSentimentIntent':
            response = await handleMarketSentimentIntent();
            break;
            
          case 'FearGreedIntent':
            response = await handleFearGreedIntent();
            break;
            
          case 'PriceIntent':
            response = await handlePriceIntent(slots.coin?.value || 'Bitcoin');
            break;
            
          case 'AMAZON.HelpIntent':
            response = await handleHelpIntent();
            break;
            
          case 'AMAZON.StopIntent':
          case 'AMAZON.CancelIntent':
            response = await handleStopIntent();
            break;
            
          default:
            response = buildResponse(
              'I didn\'t understand that. You can ask for news, market sentiment, or prices.',
              'Unknown Intent',
              'Try asking for news or prices',
              false
            );
        }
        break;
        
      case 'SessionEndedRequest':
        response = { version: '1.0', response: { shouldEndSession: true } };
        break;
        
      default:
        response = buildResponse(
          'Sorry, I didn\'t understand that request.',
          'Error',
          'Unknown request type',
          true
        );
    }
    
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      buildResponse('Sorry, something went wrong. Please try again.', 'Error', message, true)
    );
  }
}

// GET endpoint for skill verification and info
export async function GET() {
  return NextResponse.json({
    skill: 'Crypto News',
    version: '1.0.0',
    description: 'Voice-activated crypto news for Amazon Alexa',
    intents: [
      'LatestNewsIntent - Get latest crypto news',
      'BitcoinNewsIntent - Get Bitcoin news',
      'EthereumNewsIntent - Get Ethereum news',
      'MarketSentimentIntent - Get market sentiment',
      'FearGreedIntent - Get Fear & Greed Index',
      'PriceIntent - Get cryptocurrency price',
    ],
    invocationName: 'crypto news',
    examplePhrases: [
      'Alexa, open Crypto News',
      'Alexa, ask Crypto News for the latest Bitcoin news',
      'Alexa, ask Crypto News about market sentiment',
      'Alexa, ask Crypto News what is the Fear and Greed Index',
      'Alexa, ask Crypto News for the price of Ethereum',
    ],
    endpoint: 'https://cryptocurrency.cv/api/alexa',
  });
}
