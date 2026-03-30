export function SponsorCards() {
  return (
    <div className="space-y-3">
      <a href="https://pump.fun" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-lg dark:bg-emerald-900/30">🐸</div>
        <div>
          <p className="text-sm font-medium">PumpFun</p>
          <p className="text-muted-foreground text-xs">Launch memecoins on Solana</p>
        </div>
      </a>
      <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-lg dark:bg-blue-900/30">📊</div>
        <div>
          <p className="text-sm font-medium">DexScreener</p>
          <p className="text-muted-foreground text-xs">Live charts & trading data</p>
        </div>
      </a>
    </div>
  )
}
