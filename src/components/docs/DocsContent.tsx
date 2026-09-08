"use client";

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useEffect, useRef } from "react";

interface Props {
  html: string;
}

/**
 * Renders a documentation page and enhances it in the browser.
 *
 * The markdown is compiled to HTML on the server, so this only adds what
 * static HTML cannot do for itself: a copy button on every code block, and an
 * anchor link on every heading. Both are attached after paint and removed on
 * unmount, so navigating between pages does not stack up listeners.
 */
export function DocsContent({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];

    // Copy button per code block.
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector("[data-copy]")) return;
      pre.classList.add("group", "relative");

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.copy = "true";
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.className =
        "absolute right-2 top-2 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[11px] " +
        "font-medium text-white/80 opacity-0 transition-opacity hover:bg-black/60 hover:text-white " +
        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-white/40 group-hover:opacity-100";
      button.textContent = "Copy";

      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "Copied";
        } catch {
          // Clipboard can be blocked by permissions policy; say so rather than
          // leaving the button looking like it worked.
          button.textContent = "Press ctrl+c";
        }
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1600);
      };

      button.addEventListener("click", onClick);
      pre.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
      });
    });

    // Anchor link per heading, so any section is linkable.
    root.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
      if (heading.querySelector("[data-anchor]")) return;
      const anchor = document.createElement("a");
      anchor.dataset.anchor = "true";
      anchor.href = `#${heading.id}`;
      anchor.setAttribute("aria-label", `Link to ${heading.textContent ?? "this section"}`);
      anchor.className =
        "ml-2 inline-block align-middle text-(--color-text-tertiary) opacity-0 transition-opacity " +
        "hover:text-(--color-accent) focus-visible:opacity-100 group-hover/heading:opacity-100";
      anchor.textContent = "#";
      heading.classList.add("group/heading");
      heading.appendChild(anchor);
      cleanups.push(() => anchor.remove());
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <div
      ref={ref}
      className="docs-prose"
      // The markdown comes from files in this repository, compiled on the
      // server. It is trusted authored content, not user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
