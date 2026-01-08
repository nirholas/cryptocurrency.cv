export default function Footer() {
  return (
    <footer className="flex flex-col items-center py-10 text-gray-500 text-sm">
      <div className="flex space-x-4 mb-4">
        <a href="https://github.com/nirholas/free-crypto-news" className="hover:text-black">GitHub</a>
        <a href="/api/news" className="hover:text-black">API</a>
        <a href="/api/sources" className="hover:text-black">Sources</a>
      </div>
      <p>MIT Licensed • Made by <a href="https://github.com/nirholas" className="hover:text-black">nich</a></p>
    </footer>
  );
}
