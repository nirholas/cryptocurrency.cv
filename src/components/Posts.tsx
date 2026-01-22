import { 
  ArticleCardMedium, 
  ArticleCardLarge, 
  ArticleCardSmall, 
  ArticleCardList 
} from '@/components/cards';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  timeAgo: string;
  description?: string;
  category?: string;
  readTime?: string;
  id?: string;
}

interface Props {
  articles: Article[];
  /** If true, links go to external source. If false (default), links to /article/[id] */
  externalLinks?: boolean;
  /** Card variant to use: 'medium' (default), 'large', 'small', 'list' */
  variant?: 'medium' | 'large' | 'small' | 'list';
  /** For 'small' variant: show ranking numbers */
  showRank?: boolean;
}

export default function Posts({ 
  articles, 
  externalLinks = false, 
  variant = 'medium',
  showRank = false 
}: Props) {
  const validArticles = articles.filter(a => a && a.title && a.link && a.source);

  // Grid classes based on variant
  const gridClasses = {
    large: 'flex flex-col gap-6 p-4 md:p-6',
    medium: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6',
    small: 'flex flex-col gap-2 p-4',
    list: 'flex flex-col gap-4 p-4 md:p-6',
  };
  
  return (
    <div 
      id="news" 
      className={`${gridClasses[variant]} stagger-children`}
      role="feed"
      aria-label="News articles"
    >
      {validArticles.map((article, i) => {
        const key = `${article.link}-${i}`;
        
        switch (variant) {
          case 'large':
            return (
              <ArticleCardLarge 
                key={key} 
                article={article} 
                externalLink={externalLinks} 
              />
            );
          case 'small':
            return (
              <ArticleCardSmall 
                key={key} 
                article={article} 
                externalLink={externalLinks}
                rank={i + 1}
                showRank={showRank}
              />
            );
          case 'list':
            return (
              <ArticleCardList 
                key={key} 
                article={article} 
                externalLink={externalLinks} 
              />
            );
          case 'medium':
          default:
            return (
              <ArticleCardMedium 
                key={key} 
                article={article} 
                externalLink={externalLinks} 
              />
            );
        }
      })}
    </div>
  );
}
