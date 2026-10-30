/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * 🔊 Alexa Skill Handler
 * 
 * Voice-activated crypto news for Amazon Alexa.
 * "Alexa, ask Crypto News for the latest Bitcoin news"
 * 
 * POST /api/alexa - Alexa skill endpoint
 */

import { type NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-fetch';
import type { MarketSentiment, SentimentLabel } from '@/lib/news-sentiment';


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

/** The parts of /api/sentiment this skill speaks. */
interface SentimentPayload {
  market?: MarketSentiment;
  distribution?: Record<SentimentLabel, number>;
}

/** The parts of /api/fear-greed this skill speaks. */
interface FearGreedPayload {
  current?: { value: number; valueClassification: string };
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
    
    const res = await internalFetch(endpoint);
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
  } catch {
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
    const res = await internalFetch(`/api/sentiment`);
    if (!res.ok) throw new Error(`sentiment ${res.status}`);
    const data: SentimentPayload = await res.json();
    const { market, distribution } = data;
    if (typeof market?.score !== 'number') throw new Error('sentiment has no market score');

    const label = market.overall.replace(/_/g, ' ');
    const total = distribution ? Object.values(distribution).reduce((sum, n) => sum + n, 0) : 0;
    const share = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    const bullish = share((distribution?.very_bullish ?? 0) + (distribution?.bullish ?? 0));
    const bearish = share((distribution?.very_bearish ?? 0) + (distribution?.bearish ?? 0));

    const speech = `The current market sentiment is ${label} with a score of ${market.score} on a scale from -100 to 100. ${bullish}% of articles are bullish, and ${bearish}% are bearish.`;

    return buildResponse(
      speech,
      'Market Sentiment',
      `Score: ${market.score} (-100 to 100) - ${label}\nBullish: ${bullish}%\nBearish: ${bearish}%`,
      true
    );
  } catch {
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
    const res = await internalFetch(`/api/fear-greed`);
    if (!res.ok) throw new Error(`fear-greed ${res.status}`);
    const data: FearGreedPayload = await res.json();
    const value = data.current?.value;
    if (typeof value !== 'number') throw new Error('fear-greed has no current value');
    const label = data.current?.valueClassification ?? 'Neutral';
    
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
  } catch {
    return buildResponse(
      'Sorry, I could not get the Fear and Greed Index.',
      'Error',
      'Could not fetch index',
      true
    );
  }
}

/** Spoken names and tickers whose CoinGecko id differs from the slugged name. */
const SPOKEN_COIN_IDS: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  ether: 'ethereum',
  sol: 'solana',
  xrp: 'ripple',
  bnb: 'binancecoin',
  'binance-coin': 'binancecoin',
  doge: 'dogecoin',
  ada: 'cardano',
  avalanche: 'avalanche-2',
  avax: 'avalanche-2',
  ton: 'the-open-network',
  toncoin: 'the-open-network',
  dot: 'polkadot',
  link: 'chainlink',
  ltc: 'litecoin',
  shib: 'shiba-inu',
  usdt: 'tether',
  usdc: 'usd-coin',
  trx: 'tron',
  xlm: 'stellar',
};

/** Alexa hands over the spoken name ("Bitcoin", "Shiba Inu"), which is usually the CoinGecko id once slugged. */
function toCoinGeckoId(coin: string): string {
  const slug = coin.trim().toLowerCase().replace(/\s+/g, '-');
  return SPOKEN_COIN_IDS[slug] ?? slug;
}

async function handlePriceIntent(coin: string): Promise<AlexaResponse> {
  try {
    const coinId = toCoinGeckoId(coin);
    const res = await internalFetch(`/api/prices?coins=${encodeURIComponent(coinId)}`);
    const data: Record<string, { usd?: number; usd_24h_change?: number }> = res.ok
      ? await res.json()
      : {};
    const price = data[coinId];

    if (typeof price?.usd !== 'number') {
      return buildResponse(
        `I don't have price data for ${coin}. Try asking for Bitcoin, Ethereum, or another major cryptocurrency.`,
        'Price Not Found',
        `Could not find ${coin}`,
        true
      );
    }

    const coinKey = coin.trim();
    const usd = price.usd.toLocaleString('en-US');
    const change = (price.usd_24h_change ?? 0).toFixed(2);
    const direction = parseFloat(change) >= 0 ? 'up' : 'down';
    
    const speech = `${coinKey} is currently at ${usd} dollars, ${direction} ${Math.abs(parseFloat(change))} percent in the last 24 hours.`;
    
    return buildResponse(
      speech,
      `${coinKey} Price`,
      `$${usd}\n24h Change: ${change}%`,
      true
    );
  } catch {
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
