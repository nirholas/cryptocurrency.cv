"use client"

import { formatNumber, formatPercent, formatUSD, type CoinDetailData } from "@/lib/coin-data"

interface CoinMarketDataProps {
  data: CoinDetailData
  chain: string
}

function StatCard({
  label,
  value,
  subValue,
  changePercent,
}: {
  label: string
  value: string
  subValue?: string
  changePercent?: number | null
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className="text-foreground text-sm font-bold">{value}</div>
      {changePercent !== undefined && changePercent !== null && (
        <div
          className={`mt-0.5 text-xs font-medium ${
            changePercent >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatPercent(changePercent)}
        </div>
      )}
      {subValue && <div className="text-muted-foreground mt-0.5 text-xs">{subValue}</div>}
    </div>
  )
}

function TxnRow({ label, buys, sells }: { label: string; buys: number; sells: number }) {
  const total = buys + sells
  const buyPct = total > 0 ? (buys / total) * 100 : 50
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{buys}B</span>
          {" / "}
          <span className="text-red-600 dark:text-red-400">{sells}S</span>
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-green-500 transition-all" style={{ width: `${buyPct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${100 - buyPct}%` }} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground text-sm font-medium">{value}</span>
    </div>
  )
}

function formatDexName(dexId: string): string {
  const names: Record<string, string> = {
    raydium: "Raydium",
    orca: "Orca",
    uniswap: "Uniswap",
    pancakeswap: "PancakeSwap",
    uniswap_v3: "Uniswap V3",
    uniswap_v2: "Uniswap V2",
    meteora: "Meteora",
    pumpswap: "PumpSwap",
  }
  return names[dexId] || dexId.charAt(0).toUpperCase() + dexId.slice(1)
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function CoinMarketDataPanel({ data }: CoinMarketDataProps) {
  const { market, dexscreener, dexInfo, pumpfun } = data

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div>
        <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
          Price
        </div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-foreground text-2xl font-bold">{formatUSD(market.price)}</span>
          {market.priceChange24h !== null && (
            <span
              className={`text-sm font-semibold ${
                market.priceChange24h >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(market.priceChange24h)} (24h)
            </span>
          )}
        </div>
        {market.priceNative && (
          <div className="text-muted-foreground mt-0.5 text-xs">
            {market.priceNative} {dexInfo?.quoteToken.symbol || "native"}
          </div>
        )}
        {market.marketCapRank !== null && (
          <div className="text-muted-foreground mt-1 text-xs">
            CoinGecko Rank #{market.marketCapRank}
          </div>
        )}
      </div>

      {/* 24h High / Low */}
      {(market.high24h !== null || market.low24h !== null) && (
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            24h Range
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium whitespace-nowrap text-red-600 dark:text-red-400">
              {formatUSD(market.low24h)}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
              {market.price !== null &&
                market.high24h !== null &&
                market.low24h !== null &&
                market.high24h > market.low24h && (
                  <div
                    className="bg-foreground absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white shadow dark:border-gray-900"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((market.price - market.low24h) / (market.high24h - market.low24h)) * 100))}%`,
                    }}
                  />
                )}
            </div>
            <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
              {formatUSD(market.high24h)}
            </span>
          </div>
        </div>
      )}

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Market Cap"
          value={formatUSD(market.marketCap)}
          changePercent={market.marketCapChangePercent24h}
        />
        <StatCard label="24h Volume" value={formatUSD(market.volume24h)} />
        <StatCard label="Liquidity" value={formatUSD(market.liquidity)} />
        <StatCard label="FDV" value={formatUSD(market.fdv)} />
        {market.ath !== null && (
          <StatCard
            label="ATH"
            value={formatUSD(market.ath)}
            subValue={market.athDate ? new Date(market.athDate).toLocaleDateString() : undefined}
          />
        )}
        {market.atl !== null && (
          <StatCard
            label="ATL"
            value={formatUSD(market.atl)}
            subValue={market.atlDate ? new Date(market.atlDate).toLocaleDateString() : undefined}
          />
        )}
        {market.holders !== null && (
          <StatCard label="Holders" value={formatNumber(market.holders)} />
        )}
        {market.watchlistUsers !== null && (
          <StatCard label="CG Watchlists" value={formatNumber(market.watchlistUsers)} />
        )}
      </div>

      {/* Supply Info */}
      {(market.totalSupply !== null || market.circulatingSupply !== null) && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Supply
          </h4>
          <div className="space-y-2 text-sm">
            {market.circulatingSupply !== null && (
              <InfoRow label="Circulating" value={formatNumber(market.circulatingSupply)} />
            )}
            {market.totalSupply !== null && (
              <InfoRow label="Total Supply" value={formatNumber(market.totalSupply)} />
            )}
            {market.circulatingSupply !== null &&
              market.totalSupply !== null &&
              market.totalSupply > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">% Circulating</span>
                    <span className="text-foreground font-medium">
                      {((market.circulatingSupply / market.totalSupply) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (market.circulatingSupply / market.totalSupply) * 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}
          </div>
        </div>
      )}

      {/* CoinGecko Sentiment */}
      {(market.sentimentUp !== null || market.sentimentDown !== null) && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Community Sentiment
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 dark:text-green-400">
                👍 {market.sentimentUp?.toFixed(0) ?? 0}%
              </span>
              <span className="text-red-600 dark:text-red-400">
                👎 {market.sentimentDown?.toFixed(0) ?? 0}%
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${market.sentimentUp ?? 50}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${market.sentimentDown ?? 50}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Price Changes - Multiple timeframes */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Price Change
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "5m", value: dexscreener?.priceChange?.m5 ?? null },
            { label: "1h", value: market.priceChange1h },
            { label: "6h", value: dexscreener?.priceChange?.h6 ?? null },
            { label: "24h", value: market.priceChange24h },
            { label: "7d", value: market.priceChange7d },
            { label: "14d", value: market.priceChange14d },
            { label: "30d", value: market.priceChange30d },
          ]
            .filter((item) => item.value !== null)
            .map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-md p-2 text-center">
                <div className="text-muted-foreground text-[10px] uppercase">{item.label}</div>
                <div
                  className={`text-xs font-semibold ${
                    item.value! >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatPercent(item.value)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* DexScreener Transaction Data */}
      {dexscreener?.txns && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Transactions
          </h4>
          <div className="space-y-2">
            <TxnRow label="5m" buys={dexscreener.txns.m5.buys} sells={dexscreener.txns.m5.sells} />
            <TxnRow label="1h" buys={dexscreener.txns.h1.buys} sells={dexscreener.txns.h1.sells} />
            <TxnRow label="6h" buys={dexscreener.txns.h6.buys} sells={dexscreener.txns.h6.sells} />
            <TxnRow
              label="24h"
              buys={dexscreener.txns.h24.buys}
              sells={dexscreener.txns.h24.sells}
            />
          </div>
        </div>
      )}

      {/* Volume Breakdown */}
      {dexscreener?.volume && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Volume
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "5m", value: dexscreener.volume.m5 },
              { label: "1h", value: dexscreener.volume.h1 },
              { label: "6h", value: dexscreener.volume.h6 },
              { label: "24h", value: dexscreener.volume.h24 },
            ].map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-md p-2 text-center">
                <div className="text-muted-foreground text-[10px] uppercase">{item.label}</div>
                <div className="text-foreground text-xs font-semibold">{formatUSD(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidity Breakdown */}
      {(market.liquidityBase !== null || market.liquidityQuote !== null) && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Liquidity Pool
          </h4>
          <div className="space-y-2 text-sm">
            {market.liquidityBase !== null && (
              <InfoRow
                label={dexInfo?.baseToken.symbol || "Base"}
                value={formatNumber(market.liquidityBase)}
              />
            )}
            {market.liquidityQuote !== null && (
              <InfoRow
                label={dexInfo?.quoteToken.symbol || "Quote"}
                value={formatNumber(market.liquidityQuote)}
              />
            )}
          </div>
        </div>
      )}

      {/* DEX Info */}
      {dexInfo && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            DEX Info
          </h4>
          <div className="space-y-2 text-sm">
            <InfoRow label="DEX" value={formatDexName(dexInfo.dexName)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Pair</span>
              <span className="text-foreground text-sm font-medium">
                {dexInfo.baseToken.symbol}/{dexInfo.quoteToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Pair Address</span>
              <a
                href={dexInfo.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline"
              >
                {truncateAddress(dexInfo.pairAddress)}
              </a>
            </div>
            {dexInfo.pairCreatedAt && (
              <InfoRow
                label="Pair Created"
                value={new Date(dexInfo.pairCreatedAt).toLocaleDateString()}
              />
            )}
          </div>
        </div>
      )}

      {/* PumpFun Info */}
      {pumpfun && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            PumpFun
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  pumpfun.complete
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {pumpfun.complete ? "Bonding Complete" : "On Bonding Curve"}
              </span>
            </div>
            <InfoRow
              label="Program"
              value={pumpfun.program === "pump-amm" ? "Pump AMM" : "Pump Classic"}
            />
            <InfoRow label="Replies" value={pumpfun.replyCount.toLocaleString()} />
            <InfoRow
              label="Created"
              value={new Date(pumpfun.createdTimestamp).toLocaleDateString()}
            />
            {pumpfun.creator && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Creator</span>
                <a
                  href={`https://solscan.io/account/${pumpfun.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {truncateAddress(pumpfun.creator)}
                </a>
              </div>
            )}
            {pumpfun.bondingCurve && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Bonding Curve</span>
                <a
                  href={`https://solscan.io/account/${pumpfun.bondingCurve}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {truncateAddress(pumpfun.bondingCurve)}
                </a>
              </div>
            )}
            {pumpfun.poolAddress && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Pool</span>
                <a
                  href={`https://solscan.io/account/${pumpfun.poolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {truncateAddress(pumpfun.poolAddress)}
                </a>
              </div>
            )}
            {pumpfun.nsfw && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Content</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  NSFW
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
