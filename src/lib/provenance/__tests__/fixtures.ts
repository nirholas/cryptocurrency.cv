/**
 * A labelled corpus for calibrating and regression-testing the clustering.
 *
 * The similarity threshold decides whether this feature accuses an outlet of
 * following someone else's story. Picking that number by intuition, or by
 * nudging it until the tests pass, is how you ship a plausible-looking number
 * that is wrong. So the threshold is calibrated against this fixture and the
 * calibration is itself a test: if a change to tokenisation or scoring degrades
 * precision or recall, the suite fails with the numbers, not with a vague break.
 *
 * The corpus is written to look like a real hour of the aggregate feed:
 *  - seven genuine multi-outlet stories, each rewritten the way outlets rewrite
 *    (reordered, resynonymised, different framing, different money formatting)
 *  - recurring-template articles that share vocabulary but not subject, which is
 *    the failure mode that broke the first design
 *  - unrelated single-outlet articles as background, so document frequencies
 *    resemble a real corpus rather than a handful of documents
 *
 * `storyLabel` is the ground truth. Articles sharing a non-null label are the
 * same event. Null means it belongs to no cluster and must not be grouped with
 * anything.
 */

import type { ProvenanceInput } from '../types';

/** An article plus the answer. */
export interface LabelledArticle extends ProvenanceInput {
  /** Ground-truth story, or null for an article that stands alone. */
  storyLabel: string | null;
}

const BASE = Date.parse('2026-08-27T12:00:00.000Z');
/** Minutes before the fixture's "now". */
const ago = (minutes: number) => new Date(BASE - minutes * 60_000).toISOString();

/** The clock the fixture is written against. */
export const FIXTURE_NOW = new Date(BASE);

function article(
  storyLabel: string | null,
  source: string,
  sourceKey: string,
  minutesAgo: number,
  title: string,
  description: string,
): LabelledArticle {
  return {
    storyLabel,
    source,
    sourceKey,
    title,
    description,
    link: `https://${sourceKey}.example/${encodeURIComponent(title.slice(0, 40))}`,
    pubDate: ago(minutesAgo),
  };
}

export const LABELLED_CORPUS: LabelledArticle[] = [
  // ── etf-inflow: five outlets, staggered over three hours ──────────────────
  article(
    'etf-inflow',
    'The Block',
    'theblock',
    200,
    "BlackRock's Bitcoin ETF sees record $1.2B daily inflow",
    'The iShares Bitcoin Trust took in more in a single session than any spot bitcoin fund since launch, according to issuer data.',
  ),
  article(
    'etf-inflow',
    'CoinDesk',
    'coindesk',
    160,
    'Bitcoin ETF from BlackRock records $1.2 billion in daily inflows',
    'IShares Bitcoin Trust posted its largest single-session inflow since launching, issuer figures show.',
  ),
  article(
    'etf-inflow',
    'Decrypt',
    'decrypt',
    120,
    'BlackRock bitcoin fund notches record $1.2bn inflow in one day',
    'The spot bitcoin ETF from BlackRock saw record daily inflows, per data published by the issuer.',
  ),
  article(
    'etf-inflow',
    'Blockworks',
    'blockworks',
    95,
    'IShares Bitcoin Trust pulls in record inflows as BlackRock fund tops $1.2 billion',
    'BlackRock spot bitcoin product recorded its biggest single day of inflows since it launched.',
  ),
  article(
    'etf-inflow',
    'CryptoSlate',
    'cryptoslate',
    40,
    'BlackRock ETF records largest single-day bitcoin inflow at $1.2B',
    'The iShares trust took in record inflows in one session, issuer data indicates.',
  ),

  // ── pectra: three outlets ────────────────────────────────────────────────
  article(
    'pectra',
    'The Block',
    'theblock',
    150,
    'Ethereum developers set Pectra upgrade activation date',
    'Core developers agreed on a mainnet activation slot for the Pectra hard fork on an all-core-devs call.',
  ),
  article(
    'pectra',
    'Decrypt',
    'decrypt',
    110,
    'Ethereum core devs agree Pectra mainnet activation slot',
    'The Pectra hard fork now has an agreed activation epoch on Ethereum mainnet after a developer call.',
  ),
  article(
    'pectra',
    'CoinDesk',
    'coindesk',
    70,
    'Pectra hard fork gets mainnet date from Ethereum developers',
    'Ethereum core developers settled on when the Pectra upgrade activates on mainnet.',
  ),

  // ── sec-suit: four outlets, one with no usable date ──────────────────────
  article(
    'sec-suit',
    'Reuters',
    'reuters',
    300,
    'SEC sues derivatives exchange over unregistered swaps offering',
    'The Securities and Exchange Commission filed a complaint accusing the venue of offering unregistered security-based swaps to retail customers.',
  ),
  article(
    'sec-suit',
    'CoinDesk',
    'coindesk',
    250,
    'SEC files complaint against crypto derivatives venue over unregistered swaps',
    'The regulator accused the exchange of offering security-based swaps to retail traders without registration.',
  ),
  article(
    'sec-suit',
    'The Block',
    'theblock',
    230,
    'Regulator accuses derivatives exchange of unregistered swaps sales to retail',
    'An SEC complaint says the venue offered security-based swaps without registering them.',
  ),
  {
    ...article(
      'sec-suit',
      'CoinGape',
      'coingape',
      210,
      'SEC sues crypto derivatives exchange over unregistered security-based swaps',
      'The complaint accuses the venue of selling unregistered swaps to retail customers.',
    ),
    dateEstimated: true,
  },

  // ── tether-mint: two outlets, short headlines ────────────────────────────
  article(
    'tether-mint',
    'The Block',
    'theblock',
    90,
    'Tether mints $1B USDT on Tron network in latest issuance',
    'Tether issued a fresh billion dollars of USDT on Tron, blockchain data shows.',
  ),
  article(
    'tether-mint',
    'CryptoSlate',
    'cryptoslate',
    55,
    'Tether issues 1 billion USDT on the Tron blockchain',
    'A fresh USDT issuance of one billion dollars landed on Tron according to chain data.',
  ),

  // ── coinbase-earnings: three outlets ────────────────────────────────────
  article(
    'coinbase-earnings',
    'CNBC',
    'cnbc',
    400,
    'Coinbase shares jump 12% after quarterly earnings beat estimates',
    'The exchange reported revenue above analyst estimates for the quarter, sending the stock higher.',
  ),
  article(
    'coinbase-earnings',
    'Blockworks',
    'blockworks',
    370,
    'Coinbase stock rises 12% on quarterly revenue beat',
    'Coinbase topped analyst revenue estimates for the quarter and shares climbed.',
  ),
  article(
    'coinbase-earnings',
    'Decrypt',
    'decrypt',
    330,
    'Coinbase climbs after exchange beats quarterly revenue estimates',
    'Shares in the exchange rose after quarterly revenue came in above analyst estimates.',
  ),

  // ── solana-outage: three outlets ────────────────────────────────────────
  article(
    'solana-outage',
    'The Block',
    'theblock',
    500,
    'Solana validators restart network after four-hour halt',
    'Validators coordinated a restart following a halt in block production that lasted around four hours.',
  ),
  article(
    'solana-outage',
    'CoinDesk',
    'coindesk',
    470,
    'Solana network resumes after validators coordinate restart',
    'Block production stopped for roughly four hours before validators restarted the chain.',
  ),
  article(
    'solana-outage',
    'Decrypt',
    'decrypt',
    450,
    'Solana back online following coordinated validator restart',
    'The chain halted block production for about four hours before a validator restart.',
  ),

  // ── paradigm-round: two outlets ─────────────────────────────────────────
  article(
    'paradigm-round',
    'Blockworks',
    'blockworks',
    260,
    'Restaking protocol raises $50 million in round led by Paradigm',
    'The startup closed a fifty million dollar round led by Paradigm with participation from existing backers.',
  ),
  article(
    'paradigm-round',
    'The Block',
    'theblock',
    235,
    'Paradigm leads $50M funding round for restaking protocol',
    'A restaking startup raised fifty million dollars in a round Paradigm led.',
  ),

  // ── recurring templates: same vocabulary, different subject ─────────────
  article(
    null,
    'CoinGape',
    'coingape',
    30,
    'Bitcoin price analysis: BTC eyes $70,000 as momentum builds',
    'Technical indicators point to further upside for BTC in the near term according to chart watchers.',
  ),
  article(
    null,
    'CoinGape',
    'coingape',
    480,
    'Bitcoin price analysis: BTC targets $65,000 amid selloff',
    'Chart watchers see downside risk for BTC as momentum indicators weaken.',
  ),
  article(
    null,
    'AMBCrypto',
    'ambcrypto',
    45,
    'Ethereum price analysis: ETH tests resistance near $3,400',
    'Technical indicators suggest ETH may struggle at the current resistance level.',
  ),
  article(
    null,
    'AMBCrypto',
    'ambcrypto',
    380,
    'XRP price analysis: XRP holds support as volume declines',
    'Chart watchers note declining volume as XRP holds its support level.',
  ),

  // ── background: unrelated single-outlet articles ────────────────────────
  article(
    null,
    'The Block',
    'theblock',
    20,
    'Mining firm reports third quarter loss on higher energy costs',
    'The miner posted a quarterly loss as electricity prices rose across its facilities.',
  ),
  article(
    null,
    'CoinDesk',
    'coindesk',
    65,
    'Stablecoin supply on Base crosses four billion dollars',
    'Total stablecoin supply on the Base network passed four billion according to on-chain data.',
  ),
  article(
    null,
    'Decrypt',
    'decrypt',
    140,
    'NFT marketplace shuts down secondary royalties enforcement',
    'The marketplace said it would stop enforcing creator royalties on secondary sales.',
  ),
  article(
    null,
    'Blockworks',
    'blockworks',
    175,
    'Perpetuals venue launches points programme for market makers',
    'The exchange introduced a points scheme aimed at attracting professional liquidity providers.',
  ),
  article(
    null,
    'CryptoSlate',
    'cryptoslate',
    210,
    'Layer 2 rollup publishes decentralisation roadmap for sequencer',
    'The rollup outlined stages toward handing sequencer control to a permissionless set.',
  ),
  article(
    null,
    'Reuters',
    'reuters',
    280,
    'Central bank official warns on stablecoin concentration risk',
    'A senior official said concentration among stablecoin issuers poses financial stability questions.',
  ),
  article(
    null,
    'CNBC',
    'cnbc',
    320,
    'Asset manager files for spot altcoin exchange traded product',
    'The filing seeks approval for an exchange traded product tracking a large-cap altcoin.',
  ),
  article(
    null,
    'The Block',
    'theblock',
    360,
    'Custody provider adds support for staking on additional networks',
    'The custodian expanded its staking support to several additional proof-of-stake networks.',
  ),
  article(
    null,
    'CoinDesk',
    'coindesk',
    420,
    'Derivatives open interest hits yearly high across major venues',
    'Aggregate open interest across major derivatives venues reached its highest level this year.',
  ),
  article(
    null,
    'Decrypt',
    'decrypt',
    440,
    'Wallet provider ships passkey recovery for self-custody users',
    'The wallet added passkey-based recovery so users can restore access without a seed phrase.',
  ),
  article(
    null,
    'CryptoSlate',
    'cryptoslate',
    460,
    'Gaming studio delays token generation event to next quarter',
    'The studio pushed its token generation event back a quarter, citing readiness of the game client.',
  ),
  article(
    null,
    'AMBCrypto',
    'ambcrypto',
    510,
    'Exchange lists perpetual futures for three additional assets',
    'The venue added perpetual futures markets covering three more assets.',
  ),
  article(
    null,
    'Blockworks',
    'blockworks',
    530,
    'Treasury company adds to bitcoin holdings in latest purchase',
    'The listed company disclosed another purchase adding to its bitcoin treasury position.',
  ),
  article(
    null,
    'CoinGape',
    'coingape',
    550,
    'Bridge protocol pauses withdrawals pending security review',
    'The bridge halted withdrawals while it completes a review with an external security firm.',
  ),
  article(
    null,
    'Reuters',
    'reuters',
    570,
    'Regulator opens consultation on tokenised fund distribution rules',
    'The consultation covers how tokenised funds may be distributed to retail investors.',
  ),
];

/** Every ground-truth pair that should cluster together. */
export function truePairs(corpus: LabelledArticle[] = LABELLED_CORPUS): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < corpus.length; i++) {
    for (let j = i + 1; j < corpus.length; j++) {
      if (corpus[i].storyLabel && corpus[i].storyLabel === corpus[j].storyLabel) pairs.push([i, j]);
    }
  }
  return pairs;
}
