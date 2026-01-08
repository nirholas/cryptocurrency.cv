export default function Hero() {
  return (
    <div className="flex justify-between items-center bg-yellow-400 py-10 lg:py-0 border-y border-black">
      <div className="px-10 space-y-5 lg:py-12">
        <h1 className="text-5xl md:text-6xl max-w-xl font-serif">
          <span className="underline decoration-black decoration-4">Free</span>{" "}
          Crypto News API
        </h1>
        <h2 className="text-xl">
          Real-time news from 7 sources. No API keys. No rate limits. 100% free.
        </h2>
        <div className="flex space-x-4">
          <a
            href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
          >
            ▲ Deploy Your Own
          </a>
          <a
            href="#news"
            className="border border-black px-6 py-3 rounded-full font-medium hover:bg-black hover:text-white transition"
          >
            Read News ↓
          </a>
        </div>
      </div>
      <div className="hidden lg:inline-flex h-full p-10">
        <div className="text-9xl">📰</div>
      </div>
    </div>
  );
}
