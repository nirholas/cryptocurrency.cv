/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useMemo } from "react";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Glossary() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [search, setSearch] = useState("");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/glossary")
      .then((res) => res.json())
      .then((data) => {
        setTerms(data.terms ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return terms;
    const q = search.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [terms, search]);

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryTerm[]> = {};
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(t);
    }
    // Sort within each letter
    for (const letter of Object.keys(map)) {
      map[letter].sort((a, b) => a.term.localeCompare(b.term));
    }
    return map;
  }, [filtered]);

  const availableLetters = useMemo(() => new Set(Object.keys(grouped)), [grouped]);

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`glossary-${letter}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-text-secondary">
        Loading glossary…
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search terms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-(--color-surface) px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Alphabet Jump Links */}
      <div className="flex flex-wrap gap-1 mb-8">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => scrollToLetter(letter)}
            disabled={!availableLetters.has(letter)}
            className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
              availableLetters.has(letter)
                ? "bg-surface-secondary text-text-primary hover:bg-accent hover:text-white cursor-pointer"
                : "text-text-secondary opacity-40 cursor-default"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Terms */}
      {filtered.length === 0 ? (
        <p className="text-text-secondary py-4">
          No terms found matching &quot;{search}&quot;
        </p>
      ) : (
        <div className="space-y-8">
          {ALPHABET.filter((l) => grouped[l]).map((letter) => (
            <div key={letter} id={`glossary-${letter}`}>
              <h3 className="font-serif text-xl font-bold text-accent mb-3 border-b border-border pb-1">
                {letter}
              </h3>
              <div className="space-y-1">
                {grouped[letter].map((t) => {
                  const isOpen = expandedTerm === t.term;
                  return (
                    <div
                      key={t.term}
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedTerm(isOpen ? null : t.term)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-secondary transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-text-primary">
                          {t.term}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded">
                            {t.category}
                          </span>
                          <svg
                            className={`w-4 h-4 text-text-secondary transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 text-sm text-text-secondary leading-relaxed border-t border-border">
                          <p className="pt-3">{t.definition}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
