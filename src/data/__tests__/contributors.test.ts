/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Community credits: the data is well formed, and README.md, CONTRIBUTORS.md
 * and public/humans.txt match what `npm run contributors:generate` renders.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import data from '../contributors.json';
import {
  KIND_LABELS,
  README_END,
  README_START,
  applyHumansThanks,
  renderContributorsMd,
  renderReadmeSection,
  replaceBetween,
} from '../../../scripts/lib/contributors.mjs';

const root = resolve(__dirname, '../../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('contributors.json', () => {
  it('lists each person once', () => {
    const logins = data.contributors.map((c) => c.login.toLowerCase());
    expect(new Set(logins).size).toBe(logins.length);
  });

  it('gives everyone a known kind and at least one linked contribution', () => {
    for (const person of data.contributors) {
      expect(person.kinds.length, person.login).toBeGreaterThan(0);
      for (const kind of person.kinds)
        expect(Object.keys(KIND_LABELS), person.login).toContain(kind);
      expect(person.contributions.length, person.login).toBeGreaterThan(0);
      for (const c of person.contributions) {
        expect(c.summary.trim(), person.login).not.toBe('');
        expect(c.url, person.login).toMatch(
          /^https:\/\/github\.com\/nirholas\/cryptocurrency\.cv\/(commit|issues|pull)\/\w+$/,
        );
      }
    }
  });

  it('does not credit the owner or automated accounts', () => {
    const logins = data.contributors.map((c) => c.login.toLowerCase());
    expect(logins).not.toContain('nirholas');
    expect(logins.some((l) => l.endsWith('[bot]'))).toBe(false);
  });
});

describe('generated credit files are up to date', () => {
  const hint = 'run `npm run contributors:generate` and commit the result';

  it('README.md', () => {
    const readme = read('README.md');
    expect(readme, hint).toBe(
      replaceBetween(readme, README_START, README_END, renderReadmeSection(data)),
    );
  });

  it('CONTRIBUTORS.md', () => {
    expect(read('CONTRIBUTORS.md'), hint).toBe(renderContributorsMd(data));
  });

  it('public/humans.txt', () => {
    const humans = read('public/humans.txt');
    expect(humans, hint).toBe(applyHumansThanks(humans, data));
  });
});
