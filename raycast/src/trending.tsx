import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useFetch } from "@raycast/utils";

const API_BASE = "https://cryptocurrency.cv/api";

interface Topic {
  topic: string;
  count: number;
  sentiment: string;
}

interface TrendingResponse {
  trending: Topic[];
}

const sentimentColors: Record<string, Color> = {
  positive: Color.Green,
  bullish: Color.Green,
  neutral: Color.SecondaryText,
  negative: Color.Red,
  bearish: Color.Red,
};

export default function TrendingTopics() {
  const { data, isLoading } = useFetch<TrendingResponse>(`${API_BASE}/trending?limit=15`);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter trending topics...">
      <List.Section title="📈 Trending Topics">
        {data?.trending.map((topic, index) => (
          <List.Item
            key={index}
            icon={{ source: Icon.Hashtag, tintColor: sentimentColors[topic.sentiment] || Color.SecondaryText }}
            title={topic.topic}
            subtitle={`${topic.sentiment}`}
            accessories={[{ text: `${topic.count} mentions` }]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser 
                  url={`https://cryptocurrency.cv/search?q=${encodeURIComponent(topic.topic)}`} 
                />
                <Action.CopyToClipboard title="Copy Topic" content={topic.topic} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
