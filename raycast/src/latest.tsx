import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useFetch } from "@raycast/utils";

const API_BASE = "https://cryptocurrency.cv/api";

interface Article {
  title: string;
  link: string;
  description?: string;
  source: string;
  timeAgo: string;
  pubDate: string;
}

interface NewsResponse {
  articles: Article[];
  count: number;
}

const sourceIcons: Record<string, { icon: Icon; color: Color }> = {
  "CoinDesk": { icon: Icon.Globe, color: Color.Blue },
  "The Block": { icon: Icon.Document, color: Color.Purple },
  "Decrypt": { icon: Icon.Lock, color: Color.Green },
  "CoinTelegraph": { icon: Icon.Megaphone, color: Color.Orange },
  "Bitcoin Magazine": { icon: Icon.Coins, color: Color.Yellow },
  "Blockworks": { icon: Icon.Building, color: Color.Blue },
  "The Defiant": { icon: Icon.Shield, color: Color.Magenta },
};

export default function LatestNews() {
  const { data, isLoading } = useFetch<NewsResponse>(`${API_BASE}/news?limit=20`);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter news...">
      {data?.articles.map((article, index) => (
        <List.Item
          key={index}
          icon={sourceIcons[article.source]?.icon || Icon.Document}
          title={article.title}
          subtitle={article.source}
          accessories={[{ text: article.timeAgo }]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={article.link} />
              <Action.CopyToClipboard
                title="Copy Link"
                content={article.link}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Title"
                content={article.title}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
