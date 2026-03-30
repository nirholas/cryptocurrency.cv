"use server"

import { fetchCoinDetail, type CoinDetailData } from "@/lib/coin-data"

export async function getCoinDetailData(
  tokenAddress: string,
  chain: string = "solana",
  symbol?: string,
): Promise<CoinDetailData> {
  return fetchCoinDetail(tokenAddress, chain, symbol)
}
