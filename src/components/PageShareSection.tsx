/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import ShareBar from "@/components/ShareBar";

/**
 * Page-level share section that appears above the footer.
 * Automatically builds the share URL from the current window location.
 */
export default function PageShareSection({
  title,
  description,
  url,
}: {
  title: string;
  description?: string;
  url?: string;
}) {
  return (
    <section className="container-main py-6 border-t border-border">
      <ShareBar
        url={url ?? (typeof window !== "undefined" ? window.location.href : "")}
        title={title}
        description={description}
        compact
      />
    </section>
  );
}
