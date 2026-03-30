import { NextResponse } from "next/server"

import { enrichCoinData } from "@/lib/coin-data"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const chain = new URL(request.url).searchParams.get("chain") || "solana"
    const data = await enrichCoinData(address, chain)

    return NextResponse.json({ data })
  } catch (e) {
    console.error("Coin enrichment failed:", e)
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 })
  }
}
