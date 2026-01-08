interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface Props {
  articles: Article[];
}

const sourceColors: Record<string, string> = {
  'CoinDesk': 'bg-blue-100 text-blue-800',
  'The Block': 'bg-purple-100 text-purple-800',
  'Decrypt': 'bg-green-100 text-green-800',
  'CoinTelegraph': 'bg-orange-100 text-orange-800',
  'Bitcoin Magazine': 'bg-yellow-100 text-yellow-800',
  'Blockworks': 'bg-indigo-100 text-indigo-800',
  'The Defiant': 'bg-pink-100 text-pink-800',
};

export default function Posts({ articles }: Props) {
  return (
    <div id="news" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-2 md:p-6">
      {articles.map((article, i) => (
        <a
          key={i}
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-lg group cursor-pointer overflow-hidden hover:shadow-lg transition"
        >
          <div className="p-5 bg-white min-h-[180px] flex flex-col justify-between">
            <div>
              <span className={`text-xs px-2 py-1 rounded-full ${sourceColors[article.source] || 'bg-gray-100 text-gray-800'}`}>
                {article.source}
              </span>
              <p className="text-lg font-bold mt-3 group-hover:underline line-clamp-3">
                {article.title}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-3">{article.timeAgo}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
