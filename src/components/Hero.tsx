/**
 * Hero Component
 * Premium hero section with animated gradient text and floating particles
 */

import Link from 'next/link';

export default function Hero() {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black"
      aria-labelledby="hero-heading"
    >
      {/* Animated Mesh Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(251, 191, 36, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(217, 119, 6, 0.4) 0%, transparent 60%)
          `
        }}
        aria-hidden="true"
      />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-[length:40px_40px]"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `
        }}
        aria-hidden="true"
      />
      
      {/* Floating Orbs with pulse animation */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden="true" />
      <div className="absolute bottom-20 left-20 w-56 h-56 bg-black/10 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s] motion-reduce:animate-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite_1s] motion-reduce:animate-none" aria-hidden="true" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-16 lg:py-24">
          <div className="space-y-8 max-w-2xl">
            {/* Live Badge with enhanced animation */}
            <div className="inline-flex items-center gap-2 bg-black/15 backdrop-blur-md rounded-full px-5 py-2 text-sm font-semibold text-black/90 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 motion-reduce:animate-none"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              100% Free & Open Source
            </div>
            
            {/* Animated Gradient Headline */}
            <h1 
              id="hero-heading"
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-black leading-[1.1] tracking-tight"
            >
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent animate-[gradient_8s_ease_infinite] bg-[length:200%_200%] motion-reduce:animate-none">
                  Free
                </span>
                <span 
                  className="absolute -bottom-1 left-0 w-full h-4 bg-gradient-to-r from-black/20 via-black/30 to-black/20 -rotate-1 -skew-x-6"
                  aria-hidden="true"
                />
              </span>
              <br className="hidden sm:block" />
              <span className="text-black"> Crypto News API</span>
            </h1>
            
            {/* Enhanced Description */}
            <p className="text-xl sm:text-2xl text-black/80 leading-relaxed max-w-xl font-medium">
              Real-time news from <strong className="font-bold">130+ sources</strong>. No API keys. No rate limits. 
              Built for <span className="underline decoration-black/30 decoration-2 underline-offset-4">developers</span>, <span className="underline decoration-black/30 decoration-2 underline-offset-4">traders</span> & <span className="underline decoration-black/30 decoration-2 underline-offset-4">AI agents</span>.
            </p>
            
            {/* Premium CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
                className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-black/30 hover:shadow-black/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-black/50 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 22.525H0l12-21.05 12 21.05z" />
                </svg>
                Deploy Your Own
                <svg className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <Link
                href="/read"
                className="group inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-white hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                <span aria-hidden="true" className="text-xl">📖</span>
                Full Reader
              </Link>
              <Link
                href="/examples"
                className="group inline-flex items-center gap-3 bg-transparent text-black border-2 border-black/40 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black hover:text-white hover:border-black hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-black/30 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                <span aria-hidden="true" className="text-xl">💻</span>
                Code Examples
              </Link>
            </div>
            
            {/* Enhanced Feature Pills */}
            <div className="flex flex-wrap gap-4 pt-6">
              {[
                { icon: '🔓', text: 'No API Keys' },
                { icon: '⚡', text: 'No Rate Limits' },
                { icon: '📜', text: 'MIT Licensed' },
              ].map((feature) => (
                <div 
                  key={feature.text}
                  className="flex items-center gap-2.5 bg-black/10 backdrop-blur-sm rounded-full px-4 py-2"
                >
                  <span aria-hidden="true">{feature.icon}</span>
                  <span className="text-sm font-semibold text-black/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Premium API Response Preview */}
          <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative">
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent rounded-3xl blur-3xl scale-125" />
              
              {/* Stacked cards with 3D effect */}
              <div className="absolute -top-6 -left-6 w-80 h-56 bg-black/20 backdrop-blur-sm rounded-3xl border border-black/20 rotate-[-8deg] shadow-2xl" />
              <div className="absolute -top-3 -left-3 w-80 h-56 bg-black/25 backdrop-blur-sm rounded-3xl border border-black/25 rotate-[-4deg] shadow-xl" />
              
              {/* Main card - Floating terminal */}
              <div className="relative w-80 bg-gray-900/95 backdrop-blur-md rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-500">
                {/* macOS-style terminal header */}
                <div className="flex items-center gap-2 px-5 py-4 bg-gray-800/90 border-b border-gray-700/50">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono ml-3 flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    api/news
                  </span>
                </div>
                
                {/* Code preview with syntax highlighting */}
                <div className="p-5 font-mono text-sm leading-loose">
                  <div className="text-gray-500">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-purple-400">&quot;articles&quot;</span>
                    <span className="text-gray-500">: [</span>
                  </div>
                  <div className="ml-8 text-gray-500">{"{"}</div>
                  <div className="ml-12">
                    <span className="text-blue-400">&quot;title&quot;</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">&quot;BTC hits...&quot;</span>
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-400">&quot;source&quot;</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">&quot;CoinDesk&quot;</span>
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-400">&quot;timeAgo&quot;</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">&quot;2m ago&quot;</span>
                  </div>
                  <div className="ml-8 text-gray-500">{"},"}</div>
                  <div className="ml-8 text-gray-600">...</div>
                  <div className="ml-4 text-gray-500">]</div>
                  <div className="text-gray-500">{"}"}</div>
                </div>
                
                {/* Status bar with live indicator */}
                <div className="px-5 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                  <span className="text-sm text-green-400 flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse motion-reduce:animate-none" />
                    200 OK
                  </span>
                  <span className="text-sm text-gray-400 font-mono">~45ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
