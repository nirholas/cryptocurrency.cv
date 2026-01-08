import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-5 max-w-7xl mx-auto">
      <div className="flex items-center space-x-5">
        <Link href="/">
          <span className="text-2xl font-bold cursor-pointer">📰 Crypto News</span>
        </Link>
        <div className="hidden md:inline-flex items-center space-x-5">
          <Link href="https://github.com/nirholas/free-crypto-news" className="hover:underline">
            GitHub
          </Link>
          <Link href="/api/news" className="hover:underline">
            API
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <a
          href="https://github.com/nirholas/free-crypto-news"
          className="border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition"
        >
          ⭐ Star on GitHub
        </a>
      </div>
    </header>
  );
}
