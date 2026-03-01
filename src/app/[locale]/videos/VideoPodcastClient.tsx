'use client';

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */


import React, { useState } from 'react';
import type { PodcastShow } from './types';

interface Props {
  channels: { name: string; url: string; subscribers: string; emoji: string; description: string }[];
  podcasts: PodcastShow[];
}

export function VideoPodcastClient({ channels, podcasts }: Props) {
  const [tab, setTab] = useState<'channels' | 'podcasts'>('channels');

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('channels')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            tab === 'channels'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-white'
              : 'bg-white dark:bg-black text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50'
          }`}
        >
          🎬 YouTube Channels
        </button>
        <button
          onClick={() => setTab('podcasts')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            tab === 'podcasts'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-white'
              : 'bg-white dark:bg-black text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50'
          }`}
        >
          🎙️ Podcasts
        </button>
      </div>

      {tab === 'channels' && (
        <>
          {/* Educational banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">💡 Why Watch Crypto YouTube?</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Video content helps visualize complex concepts like smart contracts, DeFi protocols, and trading strategies. 
              These channels are vetted for quality — always DYOR and never take financial advice from any single source.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 p-5 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{channel.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {channel.name} ↗
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{channel.subscribers} subscribers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">{channel.description}</p>
              </a>
            ))}
          </div>

          {/* How to stay safe */}
          <div className="mt-8 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🛡️ Staying Safe with Crypto Content</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-400">
              <div>
                <strong className="text-gray-900 dark:text-white">Verify claims</strong>
                <p>Cross-reference information across multiple sources before acting on it.</p>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Beware paid promotion</strong>
                <p>Many YouTubers get paid to promote projects. Look for disclosure statements.</p>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Never share keys</strong>
                <p>No legitimate content creator will ever ask for your private keys or seed phrase.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'podcasts' && (
        <>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">🎧 Top Crypto Podcasts</h2>
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              Listen while commuting, walking, or working. Podcasts are the best way to stay informed without screen time.
            </p>
          </div>

          <div className="space-y-4">
            {podcasts.map(podcast => (
              <div
                key={podcast.id}
                className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 p-5 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center text-2xl shrink-0">
                    🎙️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{podcast.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Hosted by {podcast.host}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-amber-500">★</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{podcast.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">{podcast.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-black text-gray-600 dark:text-slate-300">
                        {podcast.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">📅 {podcast.frequency}</span>
                      <div className="flex gap-2 ml-auto">
                        {podcast.platforms.map(p => (
                          <a
                            key={p.name}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition"
                          >
                            {p.name} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
