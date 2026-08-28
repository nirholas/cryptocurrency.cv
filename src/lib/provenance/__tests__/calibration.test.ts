/**
 * Calibration: what does the threshold actually cost?
 *
 * The similarity threshold decides whether this feature tells the world that
 * one outlet followed another. A number chosen by feel, or nudged until the
 * other tests went green, would be indefensible. So it is swept across a
 * labelled corpus here, and the quality it buys is asserted rather than assumed.
 *
 * Precision is the number that matters. A missed cluster is a story we did not
 * analyse; a false cluster is a public claim that an outlet followed a story it
 * never covered. Those costs are not symmetric, so the assertions below demand
 * perfect precision and merely good recall.
 *
 * Run `npx vitest run calibration --reporter=verbose` to see the whole sweep
 * printed; it is logged deliberately so a change in tokenisation or scoring
 * shows up as a shifted curve, not just a red assertion.
 */

import { describe, it, expect } from 'vitest';

import { clusterStories, DEFAULT_THRESHOLD } from '../cluster';
import { FIXTURE_NOW, LABELLED_CORPUS, truePairs } from './fixtures';

/** Every co-membership pair the clustering produced, as `i<j` index pairs. */
function predictedPairs(threshold: number): Set<string> {
  const report = clusterStories(LABELLED_CORPUS, {
    threshold,
    now: FIXTURE_NOW,
    minOutlets: 1,
  });
  const indexOf = new Map(LABELLED_CORPUS.map((a, i) => [a.link, i]));
  const pairs = new Set<string>();
  for (const story of report.stories) {
    const members = story.appearances
      .map((a) => indexOf.get(a.link))
      .filter((i): i is number => i !== undefined)
      .sort((a, b) => a - b);
    for (let x = 0; x < members.length; x++) {
      for (let y = x + 1; y < members.length; y++) pairs.add(`${members[x]}:${members[y]}`);
    }
  }
  return pairs;
}

interface Quality {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

function evaluate(threshold: number): Quality {
  const expected = new Set(truePairs().map(([i, j]) => `${i}:${j}`));
  const actual = predictedPairs(threshold);
  let tp = 0;
  for (const pair of actual) if (expected.has(pair)) tp++;
  const fp = actual.size - tp;
  const fn = expected.size - tp;
  const precision = actual.size === 0 ? 1 : tp / actual.size;
  const recall = expected.size === 0 ? 1 : tp / expected.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    threshold,
    precision,
    recall,
    f1,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
  };
}

describe('clustering quality on the labelled corpus', () => {
  const sweep: Quality[] = [];
  for (let t = 0.05; t <= 0.6001; t += 0.05) sweep.push(evaluate(Number(t.toFixed(2))));

  it('prints the sweep so a regression shows as a moved curve, not just a red test', () => {
    const rows = sweep.map(
      (q) =>
        `  t=${q.threshold.toFixed(2)}  P=${q.precision.toFixed(3)}  R=${q.recall.toFixed(3)}  F1=${q.f1.toFixed(3)}  (tp ${q.truePositives}, fp ${q.falsePositives}, fn ${q.falseNegatives})`,
    );
    console.log(
      `\nthreshold sweep over ${LABELLED_CORPUS.length} labelled articles:\n${rows.join('\n')}\n`,
    );
    expect(sweep.length).toBeGreaterThan(5);
  });

  it('never groups two articles that are not the same story, at the shipped threshold', () => {
    const q = evaluate(DEFAULT_THRESHOLD);
    // A false positive here is a public claim that an outlet followed a story it
    // did not cover. There is no acceptable non-zero count.
    expect(q.falsePositives).toBe(0);
  });

  it('finds most of the real clusters at the shipped threshold', () => {
    const q = evaluate(DEFAULT_THRESHOLD);
    expect(q.recall).toBeGreaterThanOrEqual(0.7);
  });

  it('ships a threshold at or near the best F1 the corpus supports', () => {
    const best = sweep.reduce((a, b) => (b.f1 > a.f1 ? b : a));
    const shipped = evaluate(DEFAULT_THRESHOLD);
    expect(shipped.f1).toBeGreaterThanOrEqual(best.f1 - 0.1);
  });

  it('degrades predictably: precision never falls as the threshold rises', () => {
    // A scoring change that broke this monotonicity would mean the threshold no
    // longer means what the docs say it means.
    for (let i = 1; i < sweep.length; i++) {
      expect(sweep[i].precision).toBeGreaterThanOrEqual(sweep[i - 1].precision - 0.001);
    }
  });

  it('recovers each labelled story as one cluster at the shipped threshold', () => {
    const report = clusterStories(LABELLED_CORPUS, {
      now: FIXTURE_NOW,
      threshold: DEFAULT_THRESHOLD,
    });
    const labels = new Set(LABELLED_CORPUS.map((a) => a.storyLabel).filter(Boolean));
    for (const label of labels) {
      const members = LABELLED_CORPUS.filter((a) => a.storyLabel === label);
      const story = report.stories.find((s) =>
        s.appearances.some((ap) => ap.link === members[0].link),
      );
      expect(story, `no cluster recovered for ${label}`).toBeDefined();
      // Every member of the cluster we found must belong to this label: a
      // cluster that swept in a foreign article is worse than a missing one.
      for (const appearance of story!.appearances) {
        const source = LABELLED_CORPUS.find((a) => a.link === appearance.link);
        expect(source?.storyLabel, `${appearance.title} does not belong to ${label}`).toBe(label);
      }
    }
  });

  it('credits the earliest credible outlet in each recovered story', () => {
    const report = clusterStories(LABELLED_CORPUS, {
      now: FIXTURE_NOW,
      threshold: DEFAULT_THRESHOLD,
    });
    for (const story of report.stories) {
      if (!story.originator) continue;
      const credible = story.appearances.filter((a) => !a.dateEstimated);
      const earliest = credible.reduce((a, b) =>
        Date.parse(a.publishedAt) <= Date.parse(b.publishedAt) ? a : b,
      );
      expect(story.originator.sourceKey).toBe(earliest.sourceKey);
    }
  });
});
