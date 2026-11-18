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

interface GasResponse {
  gas: {
    slow: number;
    standard: number;
    fast: number;
    usdSlow?: number;
    usdStandard?: number;
    usdFast?: number;
    baseFee?: number;
    lastBlock?: number;
  };
  timestamp?: string;
}

function buildMarkdown(data: GasResponse): string {
  const g = data.gas;

  let md = "# ⛽ Ethereum Gas Prices\n\n";

  md += "| Speed | Gwei | Est. USD |\n";
  md += "|-------|------|----------|\n";
  md += `| 🐢 Slow | ${g.slow ?? "—"} | ${g.usdSlow != null ? "$" + g.usdSlow.toFixed(2) : "—"} |\n`;
  md += `| 🚶 Standard | ${g.standard ?? "—"} | ${g.usdStandard != null ? "$" + g.usdStandard.toFixed(2) : "—"} |\n`;
  md += `| 🚀 Fast | ${g.fast ?? "—"} | ${g.usdFast != null ? "$" + g.usdFast.toFixed(2) : "—"} |\n`;
  md += "\n";

  if (g.baseFee != null) {
    md += `**Base fee:** ${g.baseFee} gwei\n\n`;
  }
  if (g.lastBlock != null) {
    md += `**Block:** #${g.lastBlock.toLocaleString()}\n\n`;
  }
  if (data.timestamp) {
    md += `*Updated: ${data.timestamp}*\n`;
  }

  md += "\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*";
  return md;
}

export default function Gas() {
  const { data, isLoading } = useFetch<GasResponse>(`${API_BASE}/gas`);

  return (
    <Detail
      isLoading={isLoading}
      markdown={data ? buildMarkdown(data) : "Loading gas prices…"}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="Open on cryptocurrency.cv"
            url="https://cryptocurrency.cv/gas"
          />
          <Action.CopyToClipboard
            title="Copy Gas Prices"
            content={
              data
                ? `Slow: ${data.gas.slow} gwei | Standard: ${data.gas.standard} gwei | Fast: ${data.gas.fast} gwei`
                : ""
            }
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
