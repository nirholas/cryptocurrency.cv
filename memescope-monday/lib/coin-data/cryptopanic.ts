interface CryptoPanicPost {
  title: string
  url: string
  source: { title: string; domain: string }
  published_at: string
  kind: string
  currencies?: { code: string; title: string }[]
}

export async function getCryptoPanicNews(
  ticker: string,
  limit = 5,
): Promise<CryptoPanicPost[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${ticker}&kind=news&public=true`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).slice(0, limit)
  } catch (e) {
    console.error("CryptoPanic fetch failed:", e)
    return []
  }
}
