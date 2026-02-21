'use client';

/**
 * ColumnCustomizer Component
 * Modal UI for adding, removing, and reordering table columns.
 * State is persisted in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ALL_COLUMNS,
  COLUMN_GROUPS,
  COLUMN_MAP,
  DEFAULT_VISIBLE_COLUMNS,
  type ColumnDef,
} from './ColumnDefs';

const STORAGE_KEY = 'markets-columns-v1';

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useColumns(): [string[], (cols: string[]) => void] {
  const [columns, setColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Ensure pinned columns are always present and sorted first
        const pinned = ALL_COLUMNS.filter((c) => c.pinned).map((c) => c.id);
        const merged = [
          ...pinned,
          ...parsed.filter((id) => !pinned.includes(id) && COLUMN_MAP.has(id)),
        ];
        setColumns(merged);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const save = useCallback((cols: string[]) => {
    setColumns(cols);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
    } catch {
      /* ignore */
    }
  }, []);

  return [hydrated ? columns : DEFAULT_VISIBLE_COLUMNS, save];
}

// ─── Component ─────────────────────────────────────────────────────────────

interface ColumnCustomizerProps {
  activeColumns: string[];
  onChange: (cols: string[]) => void;
}

export default function ColumnCustomizer({
  activeColumns,
  onChange,
}: ColumnCustomizerProps) {
  const [open, setOpen] = useState(false);
  // Draft state inside the modal — committed on "Apply"
  const [draft, setDraft] = useState<string[]>([]);

  const openModal = useCallback(() => {
    setDraft([...activeColumns]);
    setOpen(true);
  }, [activeColumns]);

  const closeModal = useCallback(() => setOpen(false), []);

  const toggle = useCallback((id: string) => {
    const col = COLUMN_MAP.get(id);
    if (col?.pinned) return; // cannot toggle pinned
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }, []);

  const moveUp = useCallback((id: string) => {
    setDraft((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      // Don't move above pinned columns
      const pinnedCount = ALL_COLUMNS.filter((c) => c.pinned).length;
      if (idx <= pinnedCount) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setDraft((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const defaults = DEFAULT_VISIBLE_COLUMNS;
    setDraft([...defaults]);
  }, []);

  const apply = useCallback(() => {
    // Ensure pinned columns always come first
    const pinned = ALL_COLUMNS.filter((c) => c.pinned).map((c) => c.id);
    const rest = draft.filter((id) => !pinned.includes(id));
    onChange([...pinned, ...rest]);
    setOpen(false);
  }, [draft, onChange]);

  // Group the available (non-pinned) columns by group for the chooser panel
  const nonPinnedGroups = COLUMN_GROUPS.filter((g) => g.id !== 'pinned');

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        title="Customize columns"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Customize
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal panel */}
          <div className="relative bg-black rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Customize Columns
                </h2>
                <p className="text-sm text-white/50 mt-0.5">
                  Add, remove and reorder metrics
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Group picker */}
              <div className="w-full overflow-y-auto p-5 space-y-6">
                {nonPinnedGroups.map((group) => {
                  const cols = ALL_COLUMNS.filter(
                    (c) => c.group === group.id && !c.pinned,
                  );
                  if (cols.length === 0) return null;
                  return (
                    <div key={group.id}>
                      <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">
                        {group.label}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cols.map((col) => {
                          const active = draft.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              onClick={() => toggle(col.id)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                active
                                  ? 'bg-white text-black border-white'
                                  : 'bg-black text-white/50 border-white/10 hover:border-white/30'
                              }`}
                            >
                              {active && (
                                <span className="mr-1">✓</span>
                              )}
                              {col.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active column ordering */}
            {draft.filter((id) => !COLUMN_MAP.get(id)?.pinned).length > 0 && (
              <div className="border-t border-white/10 px-5 py-4">
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                  Active columns — drag to reorder
                </h3>
                <div className="flex flex-wrap gap-2">
                  {draft
                    .filter((id) => !COLUMN_MAP.get(id)?.pinned)
                    .map((id) => {
                      const col = COLUMN_MAP.get(id);
                      if (!col) return null;
                      const pos = draft.indexOf(id);
                      const pinnedCount = ALL_COLUMNS.filter((c) => c.pinned).length;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white/70"
                        >
                          <button
                            onClick={() => moveUp(id)}
                            disabled={pos <= pinnedCount}
                            className="disabled:opacity-30 hover:text-white"
                            title="Move left"
                          >
                            ‹
                          </button>
                          {col.label}
                          <button
                            onClick={() => moveDown(id)}
                            disabled={pos === draft.length - 1}
                            className="disabled:opacity-30 hover:text-white"
                            title="Move right"
                          >
                            ›
                          </button>
                          <button
                            onClick={() => toggle(id)}
                            className="ml-1 hover:text-white"
                            title="Remove"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-white/10">
              <button
                onClick={reset}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Reset to defaults
              </button>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={apply}
                  className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-white/90 rounded-lg transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Returns the ordered list of ColumnDef objects from an ordered id list */
export function resolveColumns(ids: string[]): ColumnDef[] {
  return ids.flatMap((id) => {
    const col = COLUMN_MAP.get(id);
    return col ? [col] : [];
  });
}
