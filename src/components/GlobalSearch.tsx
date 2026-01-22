'use client';

/**
 * @fileoverview Global Search Component
 * 
 * A wrapper component that connects the SearchModal to the keyboard shortcuts system.
 * Opens via Cmd+K (macOS) / Ctrl+K (Windows/Linux) or the "/" key.
 * 
 * @module components/GlobalSearch
 */

import { useShortcuts } from './KeyboardShortcuts';
import { SearchModal } from './SearchModal';

export function GlobalSearch() {
  const { openSearch, setOpenSearch } = useShortcuts();

  return (
    <SearchModal 
      isOpen={openSearch} 
      onClose={() => setOpenSearch(false)} 
    />
  );
}

export default GlobalSearch;
