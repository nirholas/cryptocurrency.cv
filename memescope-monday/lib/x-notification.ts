/**
 * Post a tweet to X using the official X API v2 with OAuth 1.0a.
 * Requires: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import crypto from "crypto"

const TWEET_URL = "https://api.x.com/2/tweets"

interface PostTweetResult {
  success: boolean
  tweetId?: string
  error?: string
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function generateOAuthHeader(method: string, url: string): string {
  const apiKey = process.env.X_API_KEY!
  const apiSecret = process.env.X_API_SECRET!
  const accessToken = process.env.X_ACCESS_TOKEN!
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET!

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString("hex")

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  }

  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&")

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64")

  oauthParams.oauth_signature = signature

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ")

  return `OAuth ${header}`
}

export async function postTweet(text: string): Promise<PostTweetResult> {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env

  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    console.warn("[X Notification] X API credentials not set, skipping tweet")
    return { success: false, error: "X API credentials not configured" }
  }

  const body = JSON.stringify({ text })

  try {
    const res = await fetch(TWEET_URL, {
      method: "POST",
      headers: {
        Authorization: generateOAuthHeader("POST", TWEET_URL),
        "Content-Type": "application/json",
      },
      body,
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`[X Notification] Tweet failed: ${res.status}`, errorBody)
      return { success: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    const tweetId = data?.data?.id

    console.log(`[X Notification] Tweet posted: ${tweetId}`)
    return { success: true, tweetId }
  } catch (error) {
    console.error("[X Notification] Error posting tweet:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Post a notification tweet when a new coin is submitted.
 */
export async function notifyXNewCoin({
  name,
  ticker,
  chain,
  slug,
}: {
  name: string
  ticker?: string | null
  chain?: string | null
  slug: string
}): Promise<PostTweetResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://memescope-monday.com"
  const url = `${baseUrl}/projects/${slug}`

  const tickerPart = ticker ? ` $${ticker}` : ""
  const chainPart = chain ? ` on ${chain.charAt(0).toUpperCase() + chain.slice(1)}` : ""

  const text = `New coin listed on Memescope Monday:${tickerPart} (${name})${chainPart}\n\nCheck it out: ${url}`

  return postTweet(text)
}
