/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Renders the community credits in src/data/contributors.json into the
 * README section, CONTRIBUTORS.md and the THANKS block of public/humans.txt.
 * Pure string functions, shared by scripts/generate-contributors.mjs (which
 * writes the files) and the vitest sync check (which fails on drift).
 */

export const KIND_LABELS = {
  code: 'Code',
  docs: 'Docs',
  security: 'Security report',
  bug: 'Bug report',
  triage: 'Triage',
  maintenance: 'Maintenance',
  feedback: 'Feedback',
};

/** Section headings in CONTRIBUTORS.md, one per primary kind. */
const SECTION_TITLES = {
  code: 'Code',
  docs: 'Documentation',
  security: 'Security reports',
  bug: 'Bug reports',
  triage: 'Triage and support',
  maintenance: 'Maintenance',
  feedback: 'Feedback',
};

/** Display order: people who wrote code first, then reporters. */
const KIND_ORDER = Object.keys(KIND_LABELS);

export const README_START = '<!-- contributors:start (generated from src/data/contributors.json by `npm run contributors:generate`) -->';
export const README_END = '<!-- contributors:end -->';
export const HUMANS_START = '/* THANKS */';

function rank(person) {
  return Math.min(...person.kinds.map((k) => KIND_ORDER.indexOf(k)));
}

/** Contributors sorted by kind of contribution, stable within a kind. */
export function ordered(data) {
  return data.contributors
    .map((person, index) => ({ person, index }))
    .sort((a, b) => rank(a.person) - rank(b.person) || a.index - b.index)
    .map(({ person }) => person);
}

const profile = (login) => `https://github.com/${login}`;
const hasProfile = (p) => p.githubProfile !== false;
/** Profile URL, or the first contribution when the account no longer exists. */
export const linkFor = (p) => (hasProfile(p) ? profile(p.login) : p.contributions[0].url);
/** GitHub's own placeholder avatar stands in for a deleted account. */
export const avatarFor = (p, size = 100) =>
  `https://github.com/${hasProfile(p) ? p.login : 'ghost'}.png?size=${size}`;
const displayName = (p) => (p.name ? `${p.name} (@${p.login})` : `@${p.login}`);
const kinds = (p) => p.kinds.map((k) => KIND_LABELS[k] ?? k).join(', ');

/** Avatar grid for the README, seven people per row. */
export function renderReadmeSection(data) {
  const people = ordered(data);
  const perRow = 7;
  const width = `${Math.floor(100 / perRow)}%`;
  const rows = [];
  for (let i = 0; i < people.length; i += perRow) {
    const cells = people.slice(i, i + perRow).map(
      (p) =>
        `    <td align="center" valign="top" width="${width}"><a href="${linkFor(p)}"><img src="${avatarFor(p)}" width="64" height="64" alt="${p.login}"/><br/><sub><b>${p.name ?? p.login}</b></sub></a><br/><sub>${kinds(p)}</sub></td>`,
    );
    rows.push(`  <tr>\n${cells.join('\n')}\n  </tr>`);
  }
  return [
    README_START,
    '<table>',
    rows.join('\n'),
    '</table>',
    '',
    `Thank you to everyone who has written code, reported bugs and security issues, or helped other users. What each person did is in [CONTRIBUTORS.md](CONTRIBUTORS.md); the same list appears on [cryptocurrency.cv/team](https://cryptocurrency.cv/team).`,
    README_END,
  ].join('\n');
}

export function renderContributorsMd(data) {
  const lines = [
    '# Contributors',
    '',
    '<!-- Generated from src/data/contributors.json by `npm run contributors:generate`. Edit the JSON, not this file. -->',
    '',
    'cryptocurrency.cv is built and maintained by [@nirholas](https://github.com/nirholas). These people made it better, and we are grateful to every one of them.',
    '',
    'Reporting a bug, a security problem or an outage is a contribution: many of the fixes below exist only because someone took the time to write it up. To be added, open an issue or a pull request that adds you to `src/data/contributors.json`.',
    '',
  ];
  for (const kind of KIND_ORDER) {
    const people = ordered(data).filter((p) => rank(p) === KIND_ORDER.indexOf(kind));
    if (people.length === 0) continue;
    lines.push(`## ${SECTION_TITLES[kind]}`, '');
    for (const p of people) {
      lines.push(`### [${displayName(p)}](${linkFor(p)})`, '');
      if (!hasProfile(p)) lines.push('_This GitHub account no longer exists._', '');
      if (p.kinds.length > 1) lines.push(`_${kinds(p)}_`, '');
      for (const c of p.contributions) lines.push(`- ${c.summary} ([link](${c.url}))`);
      lines.push('');
    }
  }
  lines.push(
    '---',
    '',
    'Dependency updates are proposed automatically by Dependabot. Commits whose author is a placeholder address or which change no files are not listed.',
    '',
  );
  return lines.join('\n');
}

export function renderHumansThanks(data) {
  const lines = [HUMANS_START, ''];
  for (const p of ordered(data)) {
    lines.push(
      `Name: ${p.name ?? p.login}`,
      hasProfile(p) ? `GitHub: ${profile(p.login)}` : `Contribution link: ${linkFor(p)}`,
      `Contribution: ${kinds(p)}`,
      '',
    );
  }
  return lines.join('\n').trimEnd() + '\n';
}

/** Replace the text between two markers (inclusive), or fail loudly. */
export function replaceBetween(text, start, end, replacement) {
  const i = text.indexOf(start);
  const j = text.indexOf(end, i);
  if (i === -1 || j === -1) throw new Error(`markers not found: ${start} ... ${end}`);
  return text.slice(0, i) + replacement + text.slice(j + end.length);
}

/**
 * Put the THANKS block in humans.txt: replace an existing one (it runs to the
 * next `/* ... *\/` heading or the end), or insert it after the TEAM block.
 */
export function applyHumansThanks(text, data) {
  const block = renderHumansThanks(data);
  const start = text.indexOf(HUMANS_START);
  if (start !== -1) {
    const next = text.slice(start + HUMANS_START.length).search(/\n\/\* [A-Z ]+ \*\//);
    const end = next === -1 ? text.length : start + HUMANS_START.length + next + 1;
    return text.slice(0, start) + block + (end < text.length ? '\n' + text.slice(end) : '');
  }
  const site = text.indexOf('/* SITE */');
  if (site === -1) return text.trimEnd() + '\n\n' + block;
  return text.slice(0, site) + block + '\n' + text.slice(site);
}
