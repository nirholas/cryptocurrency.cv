import Link from "next/link";

const COIN_TERMS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "bnb",
  "binance",
  "xrp",
  "ripple",
  "cardano",
  "ada",
  "dogecoin",
  "doge",
  "polygon",
  "matic",
  "avalanche",
  "avax",
  "chainlink",
  "link",
  "polkadot",
  "dot",
  "uniswap",
  "uni",
  "litecoin",
  "ltc",
  "monero",
  "xmr",
  "stellar",
  "xlm",
  "cosmos",
  "atom",
  "tron",
  "trx",
  "near",
  "aptos",
  "apt",
  "sui",
  "arbitrum",
  "optimism",
  "defi",
  "nft",
  "dao",
  "layer 2",
  "stablecoin",
  "usdc",
  "usdt",
  "tether",
];

interface Article {
  title: string;
  link: string;
  source: string;
  timeAgo: string;
  pubDate: string;
}

interface Props {
  currentTitle: string;
  currentDescription?: string;
  currentLink: string;
  allArticles: Article[];
}

export function RelatedByMention({
  currentTitle,
  currentDescription,
  currentLink,
  allArticles,
}: Props) {
  const text = `${currentTitle} ${currentDescription ?? ""}`.toLowerCase();
  const mentions = COIN_TERMS.filter((term) => text.includes(term));
  if (mentions.length === 0) return null;

  const related = allArticles
    .filter((a) => a.link !== currentLink)
    .filter((a) =>
      mentions.some((term) => `${a.title} `.toLowerCase().includes(term)),
    )
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">
        Related Stories
      </h3>
      <div className="space-y-3">
        {related.map((a) => (
          <Link
            key={a.link}
            href={`/article?url=${encodeURIComponent(a.link)}`}
            className="flex gap-3 group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors -mx-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                {a.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {a.source} · {a.timeAgo}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
