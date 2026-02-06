/**
 * 🎭 Farcaster Frames API
 * 
 * Interactive news frames for Farcaster/Warpcast.
 * Users can browse news, vote on sentiment, and share directly in their feed.
 * 
 * GET /api/frames - Get frame HTML
 * POST /api/frames - Handle frame actions
 */

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';
const API_BASE = `${BASE_URL}/api`;

interface FrameAction {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    inputText?: string;
    castId: { fid: number; hash: string };
  };
  trustedData: {
    messageBytes: string;
  };
}

// Generate frame HTML
function generateFrameHtml(options: {
  title: string;
  image: string;
  buttons: { label: string; action?: string; target?: string }[];
  postUrl: string;
  inputText?: string;
  state?: any;
}) {
  const { title, image, buttons, postUrl, inputText, state } = options;
  
  const buttonTags = buttons.map((btn, i) => {
    const idx = i + 1;
    let tag = `<meta property="fc:frame:button:${idx}" content="${btn.label}" />`;
    if (btn.action) {
      tag += `\n    <meta property="fc:frame:button:${idx}:action" content="${btn.action}" />`;
    }
    if (btn.target) {
      tag += `\n    <meta property="fc:frame:button:${idx}:target" content="${btn.target}" />`;
    }
    return tag;
  }).join('\n    ');
  
  const inputTag = inputText 
    ? `<meta property="fc:frame:input:text" content="${inputText}" />` 
    : '';
  
  const stateTag = state 
    ? `<meta property="fc:frame:state" content="${Buffer.from(JSON.stringify(state)).toString('base64')}" />` 
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:image" content="${image}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${image}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    ${buttonTags}
    ${inputTag}
    ${stateTag}
  </head>
  <body>
    <h1>${title}</h1>
  </body>
</html>`;
}

// Generate dynamic OG image URL
function generateImageUrl(params: {
  type: 'news' | 'sentiment' | 'trending' | 'vote-result';
  data?: any;
}) {
  const { type, data } = params;
  const encodedData = encodeURIComponent(JSON.stringify(data || {}));
  return `${BASE_URL}/api/frames/image?type=${type}&data=${encodedData}`;
}

// Fetch latest news
async function getLatestNews(limit = 5) {
  try {
    const response = await fetch(`${API_BASE}/news?limit=${limit}`);
    const data = await response.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

// Fetch sentiment
async function getSentiment() {
  try {
    const response = await fetch(`${API_BASE}/fear-greed`);
    return response.json();
  } catch {
    return { value: 50, classification: 'Neutral' };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const frame = searchParams.get('frame') || 'home';
  const index = parseInt(searchParams.get('index') || '0');
  
  // Home frame
  if (frame === 'home') {
    const html = generateFrameHtml({
      title: '🆓 Free Crypto News',
      image: generateImageUrl({ type: 'news' }),
      buttons: [
        { label: '📰 Latest News' },
        { label: '📊 Sentiment' },
        { label: '🔥 Trending' },
        { label: '🌐 Open App', action: 'link', target: BASE_URL },
      ],
      postUrl: `${BASE_URL}/api/frames`,
      state: { frame: 'home', index: 0 },
    });
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // News frame
  if (frame === 'news') {
    const articles = await getLatestNews(5);
    const article = articles[index] || articles[0];
    
    const html = generateFrameHtml({
      title: article?.title || 'Crypto News',
      image: generateImageUrl({ 
        type: 'news', 
        data: { 
          title: article?.title,
          source: article?.source,
          timeAgo: article?.timeAgo,
          index: index + 1,
          total: articles.length,
        } 
      }),
      buttons: [
        { label: '⬅️ Prev' },
        { label: '➡️ Next' },
        { label: '🗳️ Vote Bullish' },
        { label: '📖 Read', action: 'link', target: article?.link || BASE_URL },
      ],
      postUrl: `${BASE_URL}/api/frames`,
      state: { frame: 'news', index },
    });
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // Sentiment frame
  if (frame === 'sentiment') {
    const sentiment = await getSentiment();
    
    const html = generateFrameHtml({
      title: `Fear & Greed: ${sentiment.value} (${sentiment.classification})`,
      image: generateImageUrl({ type: 'sentiment', data: sentiment }),
      buttons: [
        { label: '🏠 Home' },
        { label: '📰 News' },
        { label: '🔄 Refresh' },
      ],
      postUrl: `${BASE_URL}/api/frames`,
      state: { frame: 'sentiment' },
    });
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // Default to home
  return NextResponse.redirect(`${BASE_URL}/api/frames?frame=home`);
}

export async function POST(request: NextRequest) {
  try {
    const body: FrameAction = await request.json();
    const { buttonIndex } = body.untrustedData;
    
    // Decode state
    let state: { frame: string; index: number; prevIndex?: number } = { frame: 'home', index: 0 };
    try {
      const stateHeader = request.headers.get('fc-frame-state');
      if (stateHeader) {
        state = JSON.parse(Buffer.from(stateHeader, 'base64').toString());
      }
    } catch {}
    
    // Handle home frame buttons
    if (state.frame === 'home') {
      if (buttonIndex === 1) {
        // Latest News
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=news&index=0`);
      }
      if (buttonIndex === 2) {
        // Sentiment
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=sentiment`);
      }
      if (buttonIndex === 3) {
        // Trending
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=trending`);
      }
    }
    
    // Handle news frame buttons
    if (state.frame === 'news') {
      const articles = await getLatestNews(5);
      let newIndex = state.index;
      
      if (buttonIndex === 1) {
        // Previous
        newIndex = Math.max(0, state.index - 1);
      }
      if (buttonIndex === 2) {
        // Next
        newIndex = Math.min(articles.length - 1, state.index + 1);
      }
      if (buttonIndex === 3) {
        // Vote bullish - record and show result
        // In production, store this vote
        const html = generateFrameHtml({
          title: '✅ Vote Recorded!',
          image: generateImageUrl({ 
            type: 'vote-result', 
            data: { vote: 'bullish', total: 1234 } 
          }),
          buttons: [
            { label: '📰 Back to News' },
            { label: '🏠 Home' },
          ],
          postUrl: `${BASE_URL}/api/frames`,
          state: { frame: 'vote-result', prevIndex: state.index },
        });
        
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      return NextResponse.redirect(`${BASE_URL}/api/frames?frame=news&index=${newIndex}`);
    }
    
    // Handle sentiment frame
    if (state.frame === 'sentiment') {
      if (buttonIndex === 1) {
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=home`);
      }
      if (buttonIndex === 2) {
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=news&index=0`);
      }
      if (buttonIndex === 3) {
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=sentiment`);
      }
    }
    
    // Handle vote result
    if (state.frame === 'vote-result') {
      if (buttonIndex === 1) {
        return NextResponse.redirect(`${BASE_URL}/api/frames?frame=news&index=${state.prevIndex || 0}`);
      }
      return NextResponse.redirect(`${BASE_URL}/api/frames?frame=home`);
    }
    
    // Default redirect
    return NextResponse.redirect(`${BASE_URL}/api/frames?frame=home`);
  } catch (error) {
    return NextResponse.redirect(`${BASE_URL}/api/frames?frame=home`);
  }
}
