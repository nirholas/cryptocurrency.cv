/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * /x402/conformance
 *
 * Audit any x402 origin's discovery contract, including this one.
 *
 * The point of the page is the fourth column of checks: whether the discovery
 * document and the live payment challenge describe the same thing. They are
 * written by different code, in different units, and nothing forces them to
 * agree, so they drift silently and an agent budgets from one and settles
 * against the other.
 */

import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { generateSEOMetadata } from '@/lib/seo';
import ConformanceClient from './ConformanceClient';

type Props = {
  params: Promise<{ locale: string }>;
};

const SITE_ORIGIN = 'https://cryptocurrency.cv';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'x402 Conformance Auditor — Crypto Vision',
    description:
      'Audit any x402 API in one click. Cross-validates the OpenAPI discovery document against the live 402 challenge, catches prices that disagree, payments routed to unspendable addresses, and schemas no client can resolve.',
    path: '/x402/conformance',
    locale,
    tags: ['x402', 'x402scan', 'agentic commerce', 'API conformance', 'OpenAPI', 'AI agents'],
  });
}

/** What the audit checks, in the order the failures actually bite. */
const CHECKS: { title: string; body: string }[] = [
  {
    title: 'The two prices are the same number',
    body: 'The discovery document quotes decimal USD. The challenge quotes token atomic units. Honest pairs differ by exactly the token’s decimals, so the auditor recovers that exponent and rejects anything else. A server that multiplies by 10^12 instead of 10^6 passes every validator in existence and overcharges by a million.',
  },
  {
    title: 'The money can actually be received',
    body: 'A challenge whose payTo is the zero address validates perfectly and burns the funds of the first agent that honours it. That is what an unset environment variable looks like from the outside, and no schema check will ever catch it.',
  },
  {
    title: 'Paid means paid, and free means free',
    body: 'A route advertised at a price that answers 200 fails its registration probe. A route advertised as free that answers 402 bills an agent that planned a free call. Both are invisible until the document and the wire are read side by side.',
  },
  {
    title: 'The schemas resolve where a reader looks',
    body: 'A v2 client reads the input schema at extensions.bazaar.schema.properties.input.properties.queryParams and nowhere else. A complete schema three keys away is, to every client on the network, no schema at all.',
  },
  {
    title: 'The challenge arrives before validation does',
    body: 'A probe sends no arguments. If request validation runs ahead of the payment gate the caller gets a 400 and never learns the price, which is the single most common reason an endpoint fails to list.',
  },
  {
    title: 'A fixed price stays fixed',
    body: 'Two identical unpaid calls should be quoted the same amount. If they are not, and the operation never declared dynamic pricing, a client that signs the first quote and submits after the second is refused.',
  },
];

export default async function ConformancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            x402 conformance
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Does your paid API say what it charges?
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            An x402 API states its price twice: once in the discovery document an agent reads before calling, and
            once in the payment challenge it returns at the door. Different code writes them, in different units,
            and nothing makes them agree. This audits both and reports where they diverge.
          </p>
        </header>

        <div className="mt-10">
          <ConformanceClient defaultOrigin={SITE_ORIGIN} />
        </div>

        <section className="mt-16 flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-bold tracking-tight">What it checks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CHECKS.map((check) => (
              <Card key={check.title}>
                <CardContent className="flex flex-col gap-2 p-5">
                  <h3 className="font-medium leading-snug">{check.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{check.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Run it yourself</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The engine behind this page is an open, dependency-free package. The same code produces the grade here,
            the grade in your terminal, and the SARIF your CI uploads, so they can never disagree.
          </p>
          <Card>
            <CardContent className="p-5">
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
                <code>{`# audit any origin
npx @nirholas/x402-conformance https://your-api.example.com

# gate a deploy: exit 1 on any error
npx @nirholas/x402-conformance https://your-api.example.com --fail-on error

# catch regressions between deploys
npx @nirholas/x402-conformance https://your-api.example.com --json --out baseline.json
npx @nirholas/x402-conformance https://your-api.example.com --baseline baseline.json

# upload to code scanning
npx @nirholas/x402-conformance https://your-api.example.com --sarif --out x402.sarif`}</code>
              </pre>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            Machine-readable results for this page:{' '}
            <a
              href="/api/x402/conformance"
              className="font-mono underline-offset-4 hover:underline"
            >
              /api/x402/conformance
            </a>
            . Pass <code className="font-mono text-xs">?origin=</code> to audit another host, or{' '}
            <code className="font-mono text-xs">&amp;format=sarif</code> for code scanning.
          </p>
        </section>

        <section className="mt-16 flex flex-col gap-3">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Nothing here spends money</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every probe is an ordinary unpaid request. A 402 challenge is what a server hands any anonymous caller, so
            reading it is exactly what a paying client does first and costs the operator one request. No payment header
            is constructed, no wallet is involved, and no transaction is ever signed.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
