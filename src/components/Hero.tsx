import Link from 'next/link';

export default function Hero() {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-brand-400 via-brand-500 to-amber-500"
      aria-labelledby="hero-heading"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse-slow" aria-hidden="true" />
      <div className="absolute bottom-10 left-20 w-40 h-40 bg-black/5 rounded-full blur-3xl animate-pulse-slow" aria-hidden="true" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-12 lg:py-20">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-black/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              100% Free & Open Source
            </div>
            
            <h1 
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight"
            >
              <span className="relative inline-block">
                <span className="relative z-10">Free</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-black/20 -rotate-1" aria-hidden="true" />
              </span>{" "}
              Crypto News API
            </h1>
            
            <p className="text-lg sm:text-xl text-black/80 leading-relaxed max-w-xl">
              Real-time news from <strong>7 sources</strong>. No API keys. No rate limits. 
              Built for developers, traders & AI agents.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-semibold hover:bg-gray-900 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus-ring"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 22.525H0l12-21.05 12 21.05z" />
                </svg>
                Deploy Your Own
              </a>
              <Link
                href="/read"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus-ring"
              >
                <span aria-hidden="true">📖</span>
                Full Reader
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 bg-transparent text-black border-2 border-black/30 px-6 py-3.5 rounded-full font-semibold hover:bg-black hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus-ring"
              >
                <span aria-hidden="true">💻</span>
                Code Examples
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-black/70">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No API Keys</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No Rate Limits</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>MIT Licensed</span>
              </div>
            </div>
          </div>
          
          {/* Hero Visual - API Response Preview */}
          <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent rounded-3xl blur-3xl scale-110" />
              
              {/* Stacked cards effect */}
              <div className="absolute -top-4 -left-4 w-72 h-48 bg-black/20 backdrop-blur-sm rounded-2xl border border-black/30 rotate-[-6deg]" />
              <div className="absolute -top-2 -left-2 w-72 h-48 bg-black/30 backdrop-blur-sm rounded-2xl border border-black/40 rotate-[-3deg]" />
              
              {/* Main card - API response preview */}
              <div className="relative w-72 bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono ml-2">api/news</span>
                </div>
                
                {/* Code preview */}
                <div className="p-4 font-mono text-xs leading-relaxed">
                  <div className="text-gray-500">{"{"}</div>
                  <div className="ml-3">
                    <span className="text-purple-400">&quot;articles&quot;</span>
                    <span className="text-gray-500">: [</span>
                  </div>
                  <div className="ml-6 text-gray-500">{"{"}</div>
                  <div className="ml-9">
                    <span className="text-blue-400">&quot;title&quot;</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">&quot;BTC hits...&quot;</span>
                  </div>
                  <div className="ml-9">
                    <span className="text-blue-400">&quot;source&quot;</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">&quot;CoinDesk&quot;</span>
                  </div>
                  <div className="ml-6 text-gray-500">{"},"}</div>
                  <div className="ml-6 text-gray-600">...</div>
                  <div className="ml-3 text-gray-500">]</div>
                  <div className="text-gray-500">{"}"}</div>
                </div>
                
                {/* Status bar */}
                <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-green-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    200 OK
                  </span>
                  <span className="text-xs text-gray-400">~45ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
