import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t('ai.title', { defaultValue: 'AI Intelligence Hub' }),
    description: t('ai.description', { defaultValue: 'AI-powered crypto analysis, market intelligence, and insights' }),
  };
}

const aiFeatures = [
  {
    id: 'brief',
    title: 'Daily Brief',
    description: 'AI-generated daily market summary with key insights and trends',
    icon: '📰',
    href: '/ai/brief',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'counter',
    title: 'Counter Arguments',
    description: 'Challenge any crypto thesis with AI-generated counter-arguments',
    icon: '⚖️',
    href: '/ai/counter',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'debate',
    title: 'Bull vs Bear',
    description: 'Watch AI agents debate the bull and bear case for any asset',
    icon: '🐂',
    href: '/ai/debate',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'oracle',
    title: 'AI Oracle',
    description: 'Ask anything about crypto markets and get intelligent answers',
    icon: '🔮',
    href: '/ai/oracle',
    gradient: 'from-orange-500 to-red-500',
  },
];

const aiCapabilities = [
  {
    title: 'Market Analysis',
    description: 'Real-time sentiment analysis across news, social media, and on-chain data',
    icon: '📊',
  },
  {
    title: 'Trend Detection',
    description: 'Early detection of emerging narratives and market-moving events',
    icon: '🔍',
  },
  {
    title: 'Risk Assessment',
    description: 'AI-powered risk analysis for DeFi protocols and tokens',
    icon: '⚠️',
  },
  {
    title: 'News Summarization',
    description: 'Instant TL;DR for complex news articles and research reports',
    icon: '✨',
  },
];

export default async function AIHubPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
          <span className="animate-pulse">🤖</span>
          Powered by Advanced AI
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('ai.hubTitle', { defaultValue: 'AI Intelligence Hub' })}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('ai.hubSubtitle', { defaultValue: 'Leverage cutting-edge AI to gain insights, challenge assumptions, and stay ahead of the market' })}
        </p>
      </div>

      {/* AI Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-16">
        {aiFeatures.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{feature.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* AI Agent Section */}
      <div className="mb-16">
        <Link
          href="/ai-agent"
          className="block relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8 hover:border-primary/60 transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-6xl">🤖</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">AI Market Intelligence Agent</h2>
              <p className="text-muted-foreground mb-4">
                Our most advanced AI agent continuously monitors the crypto market, analyzing news, 
                social sentiment, on-chain data, and technical indicators to provide real-time insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">Live Monitoring</span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">Multi-Source Analysis</span>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm">Real-Time Alerts</span>
              </div>
            </div>
            <div className="text-2xl text-primary">→</div>
          </div>
        </Link>
      </div>

      {/* Capabilities */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t('ai.capabilities', { defaultValue: 'AI Capabilities' })}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiCapabilities.map((capability, index) => (
            <div
              key={index}
              className="p-6 bg-card border border-border rounded-xl text-center"
            >
              <div className="text-3xl mb-3">{capability.icon}</div>
              <h3 className="font-semibold mb-2">{capability.title}</h3>
              <p className="text-sm text-muted-foreground">{capability.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-card border border-border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">
          {t('ai.ctaTitle', { defaultValue: 'Ready to Get Smarter Insights?' })}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          {t('ai.ctaDesc', { defaultValue: 'Our AI tools are free to use. Start exploring market intelligence today.' })}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/ai/brief"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Start with Daily Brief
          </Link>
          <Link
            href="/ai/oracle"
            className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Ask AI Oracle
          </Link>
        </div>
      </div>
    </div>
  );
}
