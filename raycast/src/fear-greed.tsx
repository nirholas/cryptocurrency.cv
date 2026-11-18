/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Detail, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import { useFetch } from "@raycast/utils";

const API_BASE =
  (getPreferenceValues<{ apiBaseUrl?: string }>().apiBaseUrl as string) ||
  "https://cryptocurrency.cv/api";

interface FearGreedResponse {
  value: number;
  classification: string;
  timestamp?: string;
  previous?: { value: number; classification: string };
  history?: { value: number; classification: string; date: string }[];
}

function gaugeEmoji(value: number): string {
  if (value < 20) return "😱";
  if (value < 40) return "😨";
  if (value < 60) return "😐";
  if (value < 80) return "😀";
  return "🤑";
}

function buildMarkdown(data: FearGreedResponse): string {
  const v = data.value ?? 50;
  const emoji = gaugeEmoji(v);
  const bar = "█".repeat(Math.floor(v / 5)) + "░".repeat(20 - Math.floor(v / 5));

  let md = `# ${emoji} Fear & Greed Index\n\n`;
  md += `## ${v} — ${data.classification || "Neutral"}\n\n`;
  md += `\`${bar}\` ${v}/100\n\n`;

  if (data.previous) {
    const dir = data.previous.value < v ? "⬆️" : data.previous.value > v ? "⬇️" : "➡️";
    md += `**Previous:** ${data.previous.value} — ${data.previous.classification} ${dir}\n\n`;
  }

  if (data.history && data.history.length > 0) {
    md += "### Historical Trend\n\n";
    md += "| Date | Value | Label |\n|------|-------|-------|\n";
    for (const h of data.history.slice(0, 7)) {
      md += `| ${h.date} | ${h.value} | ${h.classification} |\n`;
    }
    md += "\n";
  }

  if (data.timestamp) {
    md += `*Updated: ${data.timestamp}*\n`;
  }

  md += "\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*";
  return md;
}

export default function FearGreed() {
  const { data, isLoading } = useFetch<FearGreedResponse>(`${API_BASE}/fear-greed`);

  return (
    <Detail
      isLoading={isLoading}
      markdown={data ? buildMarkdown(data) : "Loading Fear & Greed Index…"}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="Open on cryptocurrency.cv"
            url="https://cryptocurrency.cv/fear-greed"
          />
          <Action.CopyToClipboard
            title="Copy Value"
            content={data ? `${data.value} — ${data.classification}` : ""}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
