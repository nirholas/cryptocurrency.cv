/**
 * The provenance engine.
 *
 * This code makes a public claim about named news organisations: that one of
 * them published first and the others followed. That is a reputational
 * statement, so these tests are less about "does it cluster" and more about
 * "can it be made to say something false". Most blocks below correspond to a
 * way an RSS feed can lie, or a way a text matcher can be fooled, and pin the
 * engine's refusal to make a claim it cannot support.
 *
 * Everything is exercised against {@link LABELLED_CORPUS} rather than a handful
 * of hand-written articles, because term weights are corpus-relative: a
 * three-document "corpus" has no frequency distribution, so scoring inside one
 * would measure something the production path never does. Quality numbers for
 * the clustering itself live in ./calibration.test.ts.
 */

import { describe, it, expect } from 'vitest';

import {
  buildIdf,
  buildLeaderboard,
  clusterStories,
  formatLag,
  idfNorm,
  informativeFloor,
  overlap,
  storyId,
  tokenise,
} from '../index';
import { bandConfig, candidatePairs, estimateSimilarity, signature } from '../minhash';
import type { ProvenanceInput } from '../types';
import { FIXTURE_NOW, LABELLED_CORPUS } from './fixtures';

const NOW = FIXTURE_NOW;
const at = (minutesAgo: number) => new Date(NOW.getTime() - minutesAgo * 60_000).toISOString();

/** The corpus, plus whatever a test wants to introduce into it. */
function corpusWith(...extra: ProvenanceInput[]): ProvenanceInput[] {
  return [...LABELLED_CORPUS, ...extra];
}

/** Articles carrying a given ground-truth label, as plain inputs. */
function labelled(label: string): ProvenanceInput[] {
  return LABELLED_CORPUS.filter((a) => a.storyLabel === label).map(
    ({ storyLabel: _drop, ...rest }) => rest,
  );
}

/** The clustered story containing a known article link, if any. */
function storyContaining(articles: ProvenanceInput[], link: string, opts = {}) {
  const report = clusterStories(articles, { now: NOW, ...opts });
  return report.stories.find((s) => s.appearances.some((a) => a.link === link));
}

const ETF_ORIGIN = labelled('etf-inflow')[0].link;

/** Score a pair the way the engine does: weights come from the whole corpus. */
function scorePair(a: ProvenanceInput, b: ProvenanceInput) {
  const docs = corpusWith(a, b).map((c) => new Set(tokenise(c.title, c.description)));
  const idf = buildIdf(docs);
  const floor = informativeFloor(docs.length);
  const setA = new Set(tokenise(a.title, a.description));
  const setB = new Set(tokenise(b.title, b.description));
  return overlap(setA, setB, idf, idfNorm(setA, idf), idfNorm(setB, idf), floor);
}

const asInput = (title: string, description: string): ProvenanceInput => ({
  title,
  description,
  link: `https://example.test/${encodeURIComponent(title.slice(0, 30))}`,
  pubDate: at(10),
  source: 'Example',
  sourceKey: 'example',
});

describe('tokenise', () => {
  it('strips outlet branding so it cannot act as a similarity signal', () => {
    expect(tokenise('Bitcoin ETF records inflow | CoinDesk')).toEqual(
      tokenise('Bitcoin ETF records inflow'),
    );
  });

  it('collapses every spelling of a money magnitude onto one token', () => {
    const a = tokenise('ETF sees $1.2B inflow');
    expect(a).toEqual(tokenise('ETF sees $1.2 billion inflow'));
    expect(a).toEqual(tokenise('ETF sees $1.2bn inflow'));
    expect(a.join(' ')).toContain('usd1200000000');
  });

  it('joins digit groups so a round price does not share a bare "000"', () => {
    // Every headline quoting a round number would otherwise share that token,
    // which looks like a strong match built entirely on punctuation.
    expect(tokenise('BTC eyes $70,000')).toContain('70000');
    expect(tokenise('BTC eyes $70,000')).not.toContain('000');
  });

  it('drops stopwords but keeps the entities that identify a story', () => {
    const tokens = tokenise('The SEC has approved the ETF from BlackRock');
    expect(tokens).toContain('sec');
    expect(tokens).toContain('blackrock');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('has');
  });
});

describe('IDF-weighted overlap', () => {
  it('scores two write-ups of one event as similar', () => {
    const [first, second] = labelled('etf-inflow');
    expect(scorePair(first, second).score).toBeGreaterThan(0.3);
  });

  it('scores two unrelated stories that share a topic as dissimilar', () => {
    const [etf] = labelled('etf-inflow');
    const miner = LABELLED_CORPUS.find((a) => a.title.startsWith('Mining firm reports'))!;
    expect(scorePair(etf, miner).score).toBeLessThan(0.3);
  });

  it('reports the distinctive shared terms as evidence', () => {
    const [first, second] = labelled('etf-inflow');
    expect(scorePair(first, second).terms).toContain('blackrock');
  });

  it('scores nothing when the overlap is one or two terms', () => {
    const a = asInput(
      'Paradigm leads funding round for restaking protocol',
      'A restaking startup raised money in a round Paradigm led.',
    );
    const b = asInput(
      'Paradigm publishes research on transaction ordering',
      'The firm released a paper about ordering in block construction.',
    );
    expect(scorePair(a, b).score).toBe(0);
  });

  it('treats every term as informative when the corpus is too small to judge', () => {
    const docs = [new Set(['a']), new Set(['b'])];
    expect(informativeFloor(docs.length)).toBe(0);
  });
});

describe('minhash', () => {
  it('is deterministic across calls, so two servers agree on the same corpus', () => {
    const terms = tokenise('SEC approves spot bitcoin ETF from BlackRock');
    expect(Array.from(signature(terms))).toEqual(Array.from(signature(terms)));
  });

  it('estimates set similarity within the error the signature length implies', () => {
    const a = tokenise('BlackRock bitcoin ETF sees record daily inflow of one billion');
    const b = tokenise('BlackRock bitcoin ETF sees record weekly inflow of one billion');
    const setA = new Set(a);
    const setB = new Set(b);
    let shared = 0;
    for (const t of setB) if (setA.has(t)) shared++;
    const exact = shared / (setA.size + setB.size - shared);
    expect(Math.abs(exact - estimateSimilarity(signature(a), signature(b)))).toBeLessThan(0.2);
  });

  it('picks a band configuration whose knee is near the requested similarity', () => {
    const { bands, rows } = bandConfig(0.4);
    expect(Math.abs(Math.pow(1 / bands, 1 / rows) - 0.4)).toBeLessThan(0.15);
  });

  it('proposes no pairs from a corpus of one', () => {
    expect(candidatePairs([signature(['alpha', 'beta'])], 0.3)).toEqual([]);
  });
});

describe('clusterStories', () => {
  it('groups one event written up by five outlets into a single story', () => {
    const story = storyContaining(LABELLED_CORPUS, ETF_ORIGIN);
    expect(story).toBeDefined();
    expect(story!.outletCount).toBe(5);
  });

  it('credits the outlet that published first and orders the rest by lag', () => {
    const story = storyContaining(LABELLED_CORPUS, ETF_ORIGIN)!;
    expect(story.originator?.source).toBe('The Block');
    expect(story.appearances[0].source).toBe('The Block');
    expect(story.appearances[0].lag).toBe('first');
    expect(story.appearances[1].source).toBe('CoinDesk');
    expect(story.appearances[1].lagMs).toBe(40 * 60_000);
    const lags = story.appearances.slice(1).map((a) => a.lagMs);
    expect([...lags].sort((x, y) => x - y)).toEqual(lags);
  });

  it('shows the terms that grouped the articles, as evidence', () => {
    const story = storyContaining(LABELLED_CORPUS, ETF_ORIGIN)!;
    expect(story.evidence.length).toBeGreaterThan(0);
    expect(story.evidence).toContain('blackrock');
  });

  it('refuses to credit an originator whose date the feed only guessed', () => {
    // In the fixture, CoinGape's sec-suit article is date-estimated. Reuters
    // published earliest with a real timestamp and must keep the credit.
    const story = storyContaining(LABELLED_CORPUS, labelled('sec-suit')[0].link)!;
    expect(story.originator?.source).toBe('Reuters');
    expect(story.appearances.find((a) => a.source === 'CoinGape')?.dateEstimated).toBe(true);
  });

  it('never lets an estimated date take the lead, even when it is earliest', () => {
    const members = labelled('pectra');
    // Give the last outlet an impossibly early date, but mark it estimated.
    members[2] = { ...members[2], pubDate: at(1000), dateEstimated: true };
    const story = storyContaining(corpusWith(...members), members[0].link, { minOutlets: 2 })!;
    expect(story.originator?.source).not.toBe(members[2].source);
  });

  it('refuses to hand the lead to a future-dated feed', () => {
    const members = labelled('pectra');
    members[2] = { ...members[2], pubDate: new Date(NOW.getTime() + 24 * 3600_000).toISOString() };
    const corpus = LABELLED_CORPUS.filter((a) => a.storyLabel !== 'pectra');
    const story = storyContaining([...corpus, ...members], members[0].link)!;
    expect(story.originator?.source).toBe('The Block');
    expect(story.appearances.find((a) => a.source === members[2].source)?.dateEstimated).toBe(true);
  });

  it('reports unattributed when no outlet in a story has a usable timestamp', () => {
    const members = labelled('tether-mint').map((a) => ({ ...a, dateEstimated: true }));
    const corpus = LABELLED_CORPUS.filter((a) => a.storyLabel !== 'tether-mint');
    const story = storyContaining([...corpus, ...members], members[0].link)!;
    expect(story.originator).toBeNull();
    expect(story.confidence).toBe('unattributed');
    expect(story.confidenceReason).toMatch(/timestamp/i);
  });

  it('calls a sub-minute lead low confidence rather than a scoop', () => {
    const members = labelled('tether-mint');
    members[1] = {
      ...members[1],
      pubDate: new Date(Date.parse(members[0].pubDate) + 20_000).toISOString(),
    };
    const corpus = LABELLED_CORPUS.filter((a) => a.storyLabel !== 'tether-mint');
    const story = storyContaining([...corpus, ...members], members[0].link)!;
    expect(story.confidence).toBe('low');
    expect(story.confidenceReason).toMatch(/noise/i);
  });

  it('calls a long, well-evidenced lead high confidence', () => {
    const story = storyContaining(LABELLED_CORPUS, ETF_ORIGIN)!;
    expect(story.confidence).toBe('high');
    expect(story.confidenceReason).toContain('The Block');
  });

  it('never treats one outlet posting twice as corroboration', () => {
    const [first] = labelled('etf-inflow');
    const repost = { ...first, link: `${first.link}-repost`, pubDate: at(150) };
    const corpus = LABELLED_CORPUS.filter((a) => a.storyLabel !== 'etf-inflow');
    const story = storyContaining([...corpus, first, repost], first.link, { minOutlets: 2 });
    expect(story).toBeUndefined();
  });

  it('does not group two articles published further apart than the window', () => {
    const members = labelled('tether-mint');
    members[1] = {
      ...members[1],
      pubDate: new Date(Date.parse(members[0].pubDate) - 10 * 24 * 3600_000).toISOString(),
    };
    const corpus = LABELLED_CORPUS.filter((a) => a.storyLabel !== 'tether-mint');
    expect(
      storyContaining([...corpus, ...members], members[0].link, { minOutlets: 2 }),
    ).toBeUndefined();
  });

  it('is deterministic: the same corpus yields the same ids and order', () => {
    const a = clusterStories(LABELLED_CORPUS, { now: NOW });
    const b = clusterStories(LABELLED_CORPUS, { now: NOW });
    expect(a.stories.map((s) => s.id)).toEqual(b.stories.map((s) => s.id));
  });

  it('keeps a story id stable when a following outlet edits its headline', () => {
    const before = storyContaining(LABELLED_CORPUS, ETF_ORIGIN)!.id;
    const edited = LABELLED_CORPUS.map((a) =>
      a.storyLabel === 'etf-inflow' && a.sourceKey === 'coindesk'
        ? { ...a, title: `Updated: ${a.title}` }
        : a,
    );
    expect(storyContaining(edited, ETF_ORIGIN)!.id).toBe(before);
  });

  it('counts an empty corpus as analysed rather than throwing', () => {
    const report = clusterStories([], { now: NOW });
    expect(report.stories).toEqual([]);
    expect(report.analysed).toBe(0);
  });

  it('keeps exclusives when asked, and marks them unattributed', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW, minOutlets: 1 });
    const solo = report.stories.find((s) => s.outletCount === 1);
    expect(solo).toBeDefined();
    expect(solo!.confidence).toBe('unattributed');
  });

  it('reports every article it considered, clustered or not', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW });
    const inStories = report.stories.reduce((n, s) => n + s.appearances.length, 0);
    expect(inStories + report.unclustered).toBe(LABELLED_CORPUS.length);
    expect(report.analysed).toBe(LABELLED_CORPUS.length);
  });
});

describe('buildLeaderboard', () => {
  it('credits the originator and records the followers lag', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW });
    const scores = buildLeaderboard(report.stories);
    const block = scores.find((s) => s.sourceKey === 'theblock');
    expect(block!.originated).toBeGreaterThanOrEqual(3);
    const coindesk = scores.find((s) => s.sourceKey === 'coindesk');
    expect(coindesk!.followed).toBeGreaterThan(0);
    expect(coindesk!.medianLagMs).toBeGreaterThan(0);
    expect(coindesk!.medianLag).toMatch(/after$/);
  });

  it('ranks the outlet that breaks most stories first', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW });
    const scores = buildLeaderboard(report.stories);
    expect(scores[0].sourceKey).toBe('theblock');
    expect(scores[0].originationRate).toBeGreaterThan(0.5);
  });

  it('withholds a rate until an outlet has enough decided stories', () => {
    const report = clusterStories(labelled('tether-mint'), { now: NOW });
    const scores = buildLeaderboard(report.stories);
    // One story is not a track record, so nobody gets a headline percentage.
    expect(scores.every((s) => s.originationRate === null)).toBe(true);
  });

  it('counts an exclusive separately and never as an origination', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW, minOutlets: 1 });
    const scores = buildLeaderboard(report.stories);
    const withSolos = scores.filter((s) => s.soloed > 0);
    expect(withSolos.length).toBeGreaterThan(0);
    for (const score of scores) expect(score.originated).toBeLessThanOrEqual(score.storiesCovered);
  });

  it('lists outlets that published but never clustered, with an honest zero', () => {
    const report = clusterStories(LABELLED_CORPUS, { now: NOW });
    const scores = buildLeaderboard(report.stories, [
      { title: 'x', link: 'y', pubDate: at(10), source: 'Quiet Wire', sourceKey: 'quietwire' },
    ]);
    const quiet = scores.find((s) => s.sourceKey === 'quietwire');
    expect(quiet).toBeDefined();
    expect(quiet!.originated).toBe(0);
    expect(quiet!.articles).toBe(1);
    expect(quiet!.originationRate).toBeNull();
  });
});

describe('formatLag and storyId', () => {
  it('reads the way a person would say it', () => {
    expect(formatLag(0)).toBe('first');
    expect(formatLag(30_000)).toBe('under a minute after');
    expect(formatLag(12 * 60_000)).toBe('12m after');
    expect(formatLag(3 * 3600_000)).toBe('3h after');
    expect(formatLag(3 * 3600_000 + 12 * 60_000)).toBe('3h 12m after');
    expect(formatLag(50 * 3600_000)).toBe('2d 2h after');
  });

  it('derives a short, stable id from the originating link', () => {
    expect(storyId('https://theblock.co/post/1')).toBe(storyId('https://theblock.co/post/1'));
    expect(storyId('https://theblock.co/post/1')).not.toBe(storyId('https://theblock.co/post/2'));
    expect(storyId('https://theblock.co/post/1')).toHaveLength(12);
  });
});
