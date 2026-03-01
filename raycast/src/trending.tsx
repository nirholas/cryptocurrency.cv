/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { List, ActionPanel, Action, Icon, Color, getPreferenceValues } from "@raycast/api";
import { useFetch } from "@raycast/utils";

const API_BASE =
  (getPreferenceValues<{ apiBaseUrl?: string }>().apiBaseUrl as string) ||
  "https://cryptocurrency.cv/api";

interface Article {
  title: string;
  link: string;
  source: string;
  description?: string;
  timeAgo: string;
  sentiment?: string;
}

interface TrendingResponse {
  articles?: Article[];
  trending?: { topic: string; count: number; sentiment: string }[];
}

const sentimentColors: Record<string, Color> = {
  positive: Color.Green,
  bullish: Color.Green,
  neutral: Color.SecondaryText,
  negative: Color.Red,
  bearish: Color.Red,
};

export default function Trending() {
  const { data, isLoading } = useFetch<TrendingResponse>(`${API_BASE}/trending?limit=20`);

  // If the API returns articles, render them; otherwise render topics.
  const articles = data?.articles ?? [];
  const topics = data?.trending ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter trending…">
      {articles.length > 0 && (
        <List.Section title="🔥 Trending Articles">
          {articles.map((article, i) => (
            <List.Item
              key={`a-${i}`}
              icon={{ source: Icon.Fire, tintColor: Color.Orange }}
              title={article.title}
              subtitle={article.source}
              accessories={[
                { text: article.timeAgo, icon: Icon.Clock },
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={article.link} />
                  <Action.CopyToClipboard
                    title="Copy Link"
                    content={article.link}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  {article.description && (
                    <Action.CopyToClipboard
                      title="Copy Preview"
                      content={article.description}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    />
                  )}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {topics.length > 0 && (
        <List.Section title="📈 Trending Topics">
          {topics.map((topic, i) => (
            <List.Item
              key={`t-${i}`}
              icon={{
                source: Icon.Hashtag,
                tintColor: sentimentColors[topic.sentiment] || Color.SecondaryText,
              }}
              title={topic.topic}
              subtitle={topic.sentiment}
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
      )}
    </List>
  );
}
