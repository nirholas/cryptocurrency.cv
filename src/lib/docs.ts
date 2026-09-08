/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * The documentation library.
 *
 * `docs/` holds 141 markdown files that were only ever published through
 * MkDocs at docs.cryptocurrency.cv. That hostname stopped resolving, so every
 * documentation link on the site pointed at a dead domain. The same files are
 * now rendered on the site itself at /docs, which means the markdown in the
 * repository is the single source of truth for both surfaces.
 *
 * Navigation comes from the `nav:` block of mkdocs.yml so the two surfaces can
 * never disagree about the information architecture, and so adding a page is
 * still one line in one file.
 *
 * @module lib/docs
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const MKDOCS_CONFIG = path.join(process.cwd(), 'mkdocs.yml');

/** A single page in the sidebar. */
export interface DocsNavItem {
  /** Display label from the mkdocs nav. */
  title: string;
  /** Route slug, e.g. `quickstart` or `integrations/mcp`. */
  slug: string;
  /** Source file relative to docs/, e.g. `QUICKSTART.md`. */
  file: string;
}

/** A titled group of pages in the sidebar. */
export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

/** One entry in the on-page table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface DocPage {
  slug: string;
  file: string;
  title: string;
  description: string;
  html: string;
  toc: TocEntry[];
  section: string | null;
  editUrl: string;
  prev: DocsNavItem | null;
  next: DocsNavItem | null;
}

export interface DocsSearchEntry {
  slug: string;
  title: string;
  section: string;
  /** Plain-text body, trimmed, for client-side matching. */
  text: string;
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

/**
 * Map a docs-relative file path to its route slug.
 *
 * The filenames are SCREAMING-CASE for historical reasons (`QUICKSTART.md`),
 * which makes for ugly URLs, so slugs are lowercased. `index.md` becomes the
 * section root.
 */
export function fileToSlug(file: string): string {
  const withoutExt = file.replace(/\.md$/i, '');
  const lowered = withoutExt.toLowerCase();
  if (lowered === 'index') return '';
  return lowered.replace(/\/index$/, '');
}

/**
 * Assign every file a unique slug.
 *
 * `EXAMPLES.md` and `examples/index.md` both want `/docs/examples`, and
 * whichever lost the race became unreachable. Files are sorted so the shallower
 * path claims the bare slug deterministically, and a collision falls back to
 * the full lowercased path, which is always unique because file paths are.
 */
function buildSlugMap(files: string[]): Map<string, string> {
  const bySlug = new Map<string, string>();
  const map = new Map<string, string>();

  const ordered = [...files].sort((a, b) => {
    const depth = a.split('/').length - b.split('/').length;
    return depth !== 0 ? depth : a.localeCompare(b);
  });

  for (const file of ordered) {
    const preferred = fileToSlug(file);
    if (!bySlug.has(preferred)) {
      bySlug.set(preferred, file);
      map.set(file, preferred);
      continue;
    }
    const fallback = file.replace(/\.md$/i, '').toLowerCase();
    bySlug.set(fallback, file);
    map.set(file, fallback);
  }

  return map;
}

let slugMapCache: Map<string, string> | null = null;

/** File to unique slug, computed once per process over the whole tree. */
async function getSlugMap(): Promise<Map<string, string>> {
  if (!slugMapCache) slugMapCache = buildSlugMap(await listDocFiles());
  return slugMapCache;
}

/** Resolve a request slug back to its source file. */
async function resolveSlug(slug: string): Promise<string | null> {
  const clean = slug.replace(/^\/+|\/+$/g, '').toLowerCase();
  const map = await getSlugMap();
  for (const [file, assigned] of map) {
    if (assigned === clean) return file;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Navigation, parsed out of mkdocs.yml
// ---------------------------------------------------------------------------

/**
 * Read the `nav:` block from mkdocs.yml.
 *
 * The nav is a two-level list (section, then pages), which is all the sidebar
 * needs, so this parses those two levels directly rather than pulling in a
 * YAML dependency for one block. Entries whose file is missing from disk are
 * dropped, so a stale nav line can never render a link to a 404.
 */
export async function getDocsNav(): Promise<DocsNavSection[]> {
  const [raw, existing, slugMap] = await Promise.all([
    readFile(MKDOCS_CONFIG, 'utf8').catch(() => ''),
    listDocFiles(),
    getSlugMap(),
  ]);
  const have = new Set(existing);

  const sections: DocsNavSection[] = [];
  const lines = raw.split('\n');
  const navStart = lines.findIndex((l) => l.trimEnd() === 'nav:');
  if (navStart === -1) return fallbackNav(existing);

  let current: DocsNavSection | null = null;

  for (let i = navStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    // A non-indented, non-list line ends the nav block.
    if (!/^\s/.test(line) && !line.startsWith('-')) break;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) continue;

    const body = trimmed.slice(2).trim();
    const match = body.match(/^(?:(['"]?)(.*?)\1)\s*:\s*(.*)$/);
    if (!match) continue;
    const label = match[2].trim();
    const target = match[3].trim().replace(/^['"]|['"]$/g, '');

    if (indent <= 2 && target === '') {
      current = { title: label, items: [] };
      sections.push(current);
      continue;
    }

    if (!target || !target.endsWith('.md')) continue;
    if (!have.has(target)) continue; // stale nav entry: skip rather than 404

    const item: DocsNavItem = { title: label, slug: slugMap.get(target) ?? fileToSlug(target), file: target };
    if (!current) {
      current = { title: 'Documentation', items: [] };
      sections.push(current);
    }
    current.items.push(item);
  }

  const populated = sections.filter((s) => s.items.length > 0);
  return populated.length > 0 ? populated : fallbackNav(existing);
}

/** Every markdown file under docs/, relative to docs/. */
async function listDocFiles(dir = DOCS_DIR, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listDocFiles(path.join(dir, entry.name), rel)));
    } else if (entry.name.toLowerCase().endsWith('.md')) {
      files.push(rel);
    }
  }
  return files;
}

/** Group every file by directory when mkdocs.yml cannot be read. */
function fallbackNav(files: string[]): DocsNavSection[] {
  const groups = new Map<string, DocsNavItem[]>();
  for (const file of files.sort()) {
    const dir = file.includes('/') ? file.split('/')[0] : 'Guides';
    const title = titleCase(path.basename(file, '.md'));
    const list = groups.get(dir) ?? [];
    list.push({ title, slug: file.replace(/\.md$/i, '').toLowerCase().replace(/\/index$/, ''), file });
    groups.set(dir, list);
  }
  return [...groups.entries()].map(([title, items]) => ({ title: titleCase(title), items }));
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Flatten the nav into reading order, for prev/next links. */
export async function getDocsOrder(): Promise<DocsNavItem[]> {
  const nav = await getDocsNav();
  return nav.flatMap((section) => section.items);
}

/** Every routable docs slug, for generateStaticParams. */
export async function getAllDocSlugs(): Promise<string[]> {
  return [...(await getSlugMap()).values()];
}

// ---------------------------------------------------------------------------
// MkDocs-flavoured markdown
// ---------------------------------------------------------------------------

/**
 * Rewrite MkDocs Material syntax into plain CommonMark.
 *
 * These files were written for the Material theme, which adds syntax that
 * standard markdown renders as literal junk: admonitions, content tabs,
 * attribute lists, icon shortcodes and `markdown`-attributed div wrappers.
 * Rather than ship those artefacts to the reader, each is mapped onto
 * something the site can style.
 */
export function normalizeMkdocs(markdown: string): string {
  let out = markdown;

  // Icon and emoji shortcodes: `:material-rocket-launch:`, `:busts_in_silhouette:`
  out = out.replace(/:[a-z0-9_]+(?:-[a-z0-9_]+)*:/g, (match) =>
    /^:material-|^:fontawesome-|^:octicons-/.test(match) ? '' : match,
  );

  // Attribute lists: `[Text](x.md){ .md-button .md-button--primary }`
  out = out.replace(/\)\{[^}\n]*\}/g, ')');
  out = out.replace(/^(#{1,6} .*?)\s*\{[^}\n]*\}\s*$/gm, '$1');

  // `<div class="grid" markdown>` wrappers: keep the contents, drop the shell.
  out = out.replace(/^\s*<div\b[^>]*\bmarkdown\b[^>]*>\s*$/gim, '');
  out = out.replace(/^\s*<\/div>\s*$/gim, '');
  out = out.replace(/^\s*<span class="[^"]*">([^<]*)<\/span>\s*$/gim, '**$1**');

  // Admonitions:
  //   !!! info "Title"
  //       body
  // becomes a blockquote carrying a data attribute the stylesheet picks up.
  out = out.replace(
    /^!{3}\s+(\w+)(?:\s+"([^"]*)")?\s*\n((?:(?:[ \t]{4}.*)?\n)*)/gm,
    (_match, kind: string, title: string | undefined, body: string) => {
      const dedented = body
        .split('\n')
        .map((line) => line.replace(/^[ \t]{4}/, ''))
        .join('\n')
        .trim();
      const heading = title || titleCase(kind);
      const quoted = [`**${heading}**`, '', dedented]
        .join('\n')
        .split('\n')
        .map((line) => `> ${line}`.trimEnd())
        .join('\n');
      return `${quoted}\n\n`;
    },
  );

  // Content tabs:
  //   === "cURL"
  //       code
  // becomes a bold label followed by the de-indented block.
  out = out.replace(
    /^={3}\s+"([^"]*)"\s*\n((?:(?:[ \t]{4}.*)?\n)*)/gm,
    (_match, label: string, body: string) => {
      const dedented = body
        .split('\n')
        .map((line) => line.replace(/^[ \t]{4}/, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd();
      return `**${label}**\n\n${dedented}\n\n`;
    },
  );

  return out;
}

/**
 * Rewrite links between markdown files into site routes.
 *
 * `[Quick Start](QUICKSTART.md)` has to become `/docs/quickstart` on the site
 * while staying a working relative link inside the repository, so the rewrite
 * happens at render time rather than in the source.
 */
function rewriteDocLinks(html: string, currentFile: string): string {
  const dir = path.posix.dirname(currentFile);
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    if (/^(https?:|mailto:|#|\/)/i.test(href)) return whole;
    const [target, hash] = href.split('#');
    if (!target) return whole;
    if (!/\.md$/i.test(target)) return whole;
    const resolved = path.posix.normalize(dir === '.' ? target : `${dir}/${target}`);
    const slug = fileToSlug(resolved);
    const suffix = hash ? `#${hash}` : '';
    return `href="/docs${slug ? `/${slug}` : ''}${suffix}"`;
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Strip markdown to plain text, for descriptions and the search index. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[>#\-*+|]+\s*/gm, ' ')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Read a doc's raw source, or null when the slug matches no file. */
async function readDoc(slug: string): Promise<{ file: string; raw: string } | null> {
  const file = await resolveSlug(slug);
  if (!file) return null;
  const full = path.join(DOCS_DIR, file);
  // Guard against traversal out of docs/ via a crafted slug.
  if (!full.startsWith(DOCS_DIR)) return null;
  const raw = await readFile(full, 'utf8').catch(() => null);
  return raw === null ? null : { file, raw };
}

/**
 * Render one documentation page.
 *
 * Returns null for an unknown slug so the route can call notFound().
 */
export async function getDoc(slug: string): Promise<DocPage | null> {
  const found = await readDoc(slug);
  if (!found) return null;

  const { file, raw } = found;
  const parsed = matter(raw);
  const normalized = normalizeMkdocs(parsed.content);

  const [{ unified }, remarkParse, remarkGfm, remarkRehype, rehypeSlug, rehypeHighlight, rehypeStringify] =
    await Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-gfm'),
      import('remark-rehype'),
      import('rehype-slug'),
      import('rehype-highlight'),
      import('rehype-stringify'),
    ]);

  const processed = await unified()
    .use(remarkParse.default)
    .use(remarkGfm.default)
    .use(remarkRehype.default, { allowDangerousHtml: true })
    .use(rehypeSlug.default)
    .use(rehypeHighlight.default, { detect: true, ignoreMissing: true })
    .use(rehypeStringify.default, { allowDangerousHtml: true })
    .process(normalized);

  const html = rewriteDocLinks(String(processed), file);

  // Title: frontmatter, then the first H1, then the filename.
  const h1 = normalized.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title =
    (typeof parsed.data.title === 'string' && parsed.data.title) ||
    (h1 ? toPlainText(h1) : '') ||
    titleCase(path.basename(file, '.md'));

  const plain = toPlainText(normalized.replace(/^#\s+.+$/m, ''));
  const description =
    (typeof parsed.data.description === 'string' && parsed.data.description) ||
    plain.slice(0, 180).trim();

  // Table of contents from the H2/H3 headings, slugged the same way rehype-slug
  // does so the anchors line up.
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  const fence = /```[\s\S]*?```/g;
  const withoutCode = normalized.replace(fence, '');
  for (const line of withoutCode.split('\n')) {
    const heading = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!heading) continue;
    const text = toPlainText(heading[2]);
    if (!text) continue;
    toc.push({ id: slugger.slug(text), text, depth: heading[1].length as 2 | 3 });
  }

  const order = await getDocsOrder();
  const nav = await getDocsNav();
  const index = order.findIndex((item) => item.file === file);
  const section = nav.find((s) => s.items.some((item) => item.file === file))?.title ?? null;

  return {
    slug: (await getSlugMap()).get(file) ?? fileToSlug(file),
    file,
    title,
    description,
    html,
    toc,
    section,
    editUrl: `https://github.com/nirholas/cryptocurrency.cv/edit/main/docs/${file}`,
    prev: index > 0 ? order[index - 1] : null,
    next: index >= 0 && index < order.length - 1 ? order[index + 1] : null,
  };
}

/**
 * Build the client-side search index.
 *
 * Every page contributes its title, section and a trimmed body. The whole
 * index is a few hundred KB, small enough to ship once and search instantly in
 * the browser without standing up a search service.
 */
export async function getDocsSearchIndex(): Promise<DocsSearchEntry[]> {
  const nav = await getDocsNav();
  const entries: DocsSearchEntry[] = [];

  for (const section of nav) {
    for (const item of section.items) {
      const raw = await readFile(path.join(DOCS_DIR, item.file), 'utf8').catch(() => null);
      if (raw === null) continue;
      const body = toPlainText(normalizeMkdocs(matter(raw).content));
      entries.push({
        slug: item.slug,
        title: item.title,
        section: section.title,
        text: body.slice(0, 1200),
      });
    }
  }

  return entries;
}
