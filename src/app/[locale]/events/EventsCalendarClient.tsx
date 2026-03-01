'use client';

import React, { useState, useMemo } from 'react';
import type { CryptoEvent, EventCategory } from './page';

const categoryConfig: Record<EventCategory, { emoji: string; label: string; color: string; bg: string }> = {
  conference:     { emoji: '🎤', label: 'Conference', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  halving:        { emoji: '⛏️', label: 'Halving', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  upgrade:        { emoji: '⬆️', label: 'Upgrade', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  'token-unlock': { emoji: '🔓', label: 'Token Unlock', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  airdrop:        { emoji: '🪂', label: 'Airdrop', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40' },
  fork:           { emoji: '🍴', label: 'Fork', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40' },
  meetup:         { emoji: '🤝', label: 'Meetup', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-900/40' },
  hackathon:      { emoji: '💻', label: 'Hackathon', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  regulatory:     { emoji: '⚖️', label: 'Regulatory', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  earnings:       { emoji: '📊', label: 'Earnings', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  other:          { emoji: '📌', label: 'Other', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const importanceColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-gray-400',
};

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const diff = new Date(iso + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function EventsCalendarClient({ events }: { events: CryptoEvent[] }) {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [showPast, setShowPast] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category));
    return Array.from(cats).sort();
  }, [events]);

  const filtered = useMemo(() => {
    let list = events
      .filter(e => filter === 'all' || e.category === filter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (!showPast) {
      list = list.filter(e => daysUntil(e.endDate || e.date) >= -1);
    }
    return list;
  }, [events, filter, showPast]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          All Events
        </button>
        {categories.map(cat => {
          const cfg = categoryConfig[cat as EventCategory];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat as EventCategory)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition inline-flex items-center gap-1.5 ${
                filter === cat
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cfg.emoji}</span> {cfg.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={() => setShowPast(!showPast)}
              className="rounded border-gray-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            Show past
          </label>
          <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-gray-100 dark:bg-slate-700 font-medium' : ''}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 text-sm ${view === 'grid' ? 'bg-gray-100 dark:bg-slate-700 font-medium' : ''}`}
            >
              ▦ Grid
            </button>
          </div>
        </div>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events', value: events.length, emoji: '📅' },
          { label: 'Upcoming', value: events.filter(e => daysUntil(e.date) >= 0).length, emoji: '⏳' },
          { label: 'This Month', value: events.filter(e => { const d = new Date(e.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, emoji: '📆' },
          { label: 'Conferences', value: events.filter(e => e.category === 'conference').length, emoji: '🎤' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
            <span className="text-2xl">{stat.emoji}</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Events list / grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-400">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filtered.map(event => {
            const days = daysUntil(event.date);
            const cfg = categoryConfig[event.category];
            const isPast = days < 0;
            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 border-l-4 ${importanceColors[event.importance]} ${isPast ? 'opacity-60' : ''} hover:shadow-lg transition`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      {event.importance === 'critical' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          🔥 Critical
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {event.url ? (
                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                          {event.title} ↗
                        </a>
                      ) : (
                        event.title
                      )}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    {isPast ? (
                      <span className="text-xs font-medium text-gray-400 dark:text-slate-500">Ended</span>
                    ) : days === 0 ? (
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">TODAY</span>
                    ) : (
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{days}d</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{event.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span>📅 {formatDate(event.date)}{event.endDate ? ` — ${formatDate(event.endDate)}` : ''}</span>
                  {event.location && <span>📍 {event.location}</span>}
                </div>
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {event.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-xs text-gray-600 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
