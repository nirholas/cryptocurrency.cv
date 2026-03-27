import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import FooterNewsletter from '@/components/FooterNewsletter';
import FooterSection from '@/components/FooterSection';
import LanguageSelector from '@/components/LanguageSelector';
import BackToTop from '@/components/BackToTop';
import Logo from '@/components/Logo';
import { Github, TrendingUp, Smartphone } from 'lucide-react';

const FOOTER_SECTIONS = [
  {
    title: 'News',
    links: [
      { label: 'Bitcoin', href: '/category/bitcoin' },
      { label: 'Ethereum', href: '/category/ethereum' },
      { label: 'DeFi', href: '/category/defi' },
      { label: 'NFTs', href: '/category/nft' },
      { label: 'Regulation', href: '/category/regulation' },
      { label: 'Altcoins', href: '/category/altcoins' },
      { label: 'Solana', href: '/category/solana' },
      { label: 'Topics', href: '/tags' },
      { label: 'Podcast', href: '/podcast' },
    ],
  },
  {
    title: 'Markets',
    links: [
      { label: 'Overview', href: '/markets' },
      { label: 'Intelligence', href: '/intelligence' },
      { label: 'Fear & Greed', href: '/fear-greed' },
      { label: 'Heatmap', href: '/heatmap' },
      { label: 'Screener', href: '/screener' },
      { label: 'Gas Tracker', href: '/gas' },
      { label: 'Token Unlocks', href: '/unlocks' },
      { label: 'Derivatives', href: '/derivatives' },
      { label: 'Stablecoins', href: '/stablecoins' },
      { label: 'L2 / Rollups', href: '/l2' },
      { label: 'Whales', href: '/whales' },
      { label: 'Exchanges', href: '/exchanges' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'API Documentation', href: '/developers' },
      { label: 'Widget Builder', href: '/widgets' },
      { label: 'Sources', href: '/sources' },
      { label: 'Authors', href: '/authors' },
      { label: 'Calculator', href: '/calculator' },
      { label: 'Compare', href: '/compare' },
      { label: 'RSS Feed', href: '/api/rss' },
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Settings', href: '/settings' },
      { label: 'Explore', href: '/explore' },
      { label: 'Sentiment', href: '/sentiment' },
      { label: 'Archive', href: '/archive' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Team', href: '/team' },
      { label: 'Contact', href: '/contact' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Ethics', href: '/ethics' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Learn', href: '/learn' },
      { label: 'Newsletters', href: '/newsletters' },
      { label: 'Blog', href: '/blog' },
      { label: 'Status', href: '/status' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Advertising Disclosure', href: '/advertising-disclosure' },
      { label: 'Press Releases', href: '/press-releases' },
      { label: 'Submit Press Release', href: '/submit-press-release' },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/nirholas/free-crypto-news',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    label: 'X (@nichxbt)',
    href: 'https://x.com/nichxbt',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/freecryptonews',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/freecryptonews',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

const TRENDING_TOPICS = [
  { label: 'Bitcoin ETF', href: '/tags/etf' },
  { label: 'Ethereum L2', href: '/tags/layer-2' },
  { label: 'Solana DeFi', href: '/tags/solana' },
  { label: 'AI Crypto', href: '/tags/ai-crypto' },
  { label: 'Stablecoin', href: '/tags/stablecoins' },
  { label: 'Mining', href: '/tags/mining' },
  { label: 'Halving', href: '/tags/halving' },
  { label: 'Regulation', href: '/tags/regulation' },
];

function FooterStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WPFooter',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Crypto Vision',
      url: 'https://cryptocurrency.cv',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://cryptocurrency.cv/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: 'Crypto Vision',
      url: 'https://cryptocurrency.cv',
      logo: 'https://cryptocurrency.cv/logo.png',
      sameAs: [
        'https://github.com/nirholas/free-crypto-news',
        'https://x.com/nichxbt',
        'https://discord.gg/freecryptonews',
        'https://t.me/freecryptonews',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@cryptocurrency.cv',
        contactType: 'customer support',
      },
      advertisingContact: {
        '@type': 'ContactPoint',
        email: 'ads@cryptocurrency.cv',
        contactType: 'advertising',
        url: 'https://cryptocurrency.cv/advertise',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function ApiStatusBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="text-xs font-medium text-green-600 dark:text-green-400">
        {label}
      </span>
    </div>
  );
}

export default async function Footer() {
  const t = await getTranslations('footer');
  return (
    <>
      <footer className="border-border bg-surface-secondary border-t" role="contentinfo">
        <FooterStructuredData />

        <div className="container-main py-14">
          {/* Trending Topics Bar */}
          <nav
            className="border-border mb-12 rounded-xl border bg-(--color-surface) p-5 shadow-(--shadow-card)"
            aria-label="Trending topics"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-text-tertiary mr-2 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] uppercase">
                <TrendingUp className="h-3.5 w-3.5" /> {t('trending')}
              </span>
              {TRENDING_TOPICS.map((topic) => (
                <Link
                  key={topic.label}
                  href={topic.href}
                  className="border-border bg-surface-secondary text-text-secondary hover:border-accent/40 hover:bg-accent/8 hover:text-accent rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </nav>
          {/* Top section */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-6">
            {/* Brand + Newsletter */}
            <div className="col-span-1 mb-4 md:col-span-2 lg:mb-0">
              <Link href="/" aria-label="Crypto Vision home">
                <Logo size="md" />
              </Link>
              <p className="text-text-secondary mt-4 max-w-xs text-sm leading-relaxed">
                {t('description')}
              </p>

              {/* API status */}
              <div className="mt-3">
                <ApiStatusBadge label={t('apiOperational')} />
              </div>

              {/* Mini newsletter */}
              <div className="mt-4">
                <p className="text-text-primary mb-2 text-xs font-semibold">{t('subscribeUpdates')}</p>
                <FooterNewsletter />
              </div>

              {/* Social links */}
              <div className="mt-5 flex gap-3" role="list" aria-label="Social media links">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-tertiary hover:border-border hover:text-text-primary rounded-lg border border-transparent p-2 transition-all hover:bg-(--color-surface) hover:shadow-sm"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link sections — collapsible on mobile */}
            {FOOTER_SECTIONS.map((section) => (
              <FooterSection key={section.title} title={section.title} links={section.links} />
            ))}
          </div>

          {/* Download App + Language */}
          <div className="border-border mt-12 flex flex-col items-start justify-between gap-6 border-t pt-8 sm:flex-row sm:items-center">
            {/* Download App */}
            <div>
              <p className="text-text-primary mb-2 flex items-center gap-1 text-xs font-semibold">
                <Smartphone className="h-3 w-3" /> {t('downloadApp')}
              </p>
              <div className="flex gap-3">
                <span className="border-border text-text-secondary inline-flex items-center gap-1.5 rounded-lg border bg-(--color-surface) px-3 py-1.5 text-xs">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {t('comingSoon')}
                </span>
                <span className="border-border text-text-secondary inline-flex items-center gap-1.5 rounded-lg border bg-(--color-surface) px-3 py-1.5 text-xs">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 0 1-.609-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.6l2.573 1.49c.906.524.906 1.282 0 1.806l-2.573 1.49-2.573-2.393 2.573-2.393zM5.864 2.658L16.8 8.991l-2.302 2.302-8.634-8.635z" />
                  </svg>
                  {t('comingSoon')}
                </span>
              </div>
            </div>

            {/* Language Selector */}
            <LanguageSelector />
          </div>

          {/* Bottom bar */}
          <div className="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-text-tertiary text-xs tracking-wide">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="text-text-tertiary flex items-center gap-3 text-xs">
              <span>{t('sourcesCount')}</span>
              <span className="text-border">|</span>
              <span>{t('noApiKey')}</span>
              <span className="text-border">|</span>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                {t('starOnGithub')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      <BackToTop />
    </>
  );
}
