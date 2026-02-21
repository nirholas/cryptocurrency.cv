/**
 * KeyboardShortcuts Component
 * 
 * Modal showing available keyboard shortcuts
 */

'use client';

import { memo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { KEYBOARD_SHORTCUTS } from './types';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

function KeyboardShortcutsComponent({ isOpen, onClose }: KeyboardShortcutsProps) {
  const t = useTranslations('common');
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedShortcuts = KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof KEYBOARD_SHORTCUTS[number][]>);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    input: 'Input',
    control: 'Control',
    clipboard: 'Clipboard',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Shortcuts list */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50"
                    >
                      <span className="text-sm text-gray-300">{shortcut.action}</span>
                      <kbd className="px-2.5 py-1 text-xs font-mono bg-gray-800 text-gray-300 
                                      border border-gray-700 rounded-md shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="px-5 py-3 border-t border-gray-800 bg-gray-800/30">
            <p className="text-xs text-gray-500 text-center">
              Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400 font-mono">?</kbd> or 
              <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400 font-mono ml-1">Cmd/Ctrl + /</kbd> to open this
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const KeyboardShortcuts = memo(KeyboardShortcutsComponent);
export default KeyboardShortcuts;
