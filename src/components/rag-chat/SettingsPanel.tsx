/**
 * SettingsPanel Component
 * 
 * Chat settings panel with toggles and preferences
 */

'use client';

import { memo, useState } from 'react';
import type { ChatSettings } from './types';
import { DEFAULT_CHAT_SETTINGS } from './types';

interface SettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

function SettingsPanelComponent({
  settings,
  onSettingsChange,
  isOpen,
  onClose,
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_CHAT_SETTINGS);
    onSettingsChange(DEFAULT_CHAT_SETTINGS);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 
                   shadow-2xl z-50 transform transition-transform duration-300"
        role="dialog"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings content */}
        <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-6">
          {/* Display section */}
          <section>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Display
            </h3>
            <div className="space-y-4">
              <ToggleSetting
                label="Show confidence scores"
                description="Display AI confidence level for responses"
                checked={localSettings.showConfidence}
                onChange={(v) => handleChange('showConfidence', v)}
              />
              <ToggleSetting
                label="Show sources"
                description="Show source documents used for answers"
                checked={localSettings.showSources}
                onChange={(v) => handleChange('showSources', v)}
              />
              <ToggleSetting
                label="Show suggestions"
                description="Display follow-up question suggestions"
                checked={localSettings.showSuggestions}
                onChange={(v) => handleChange('showSuggestions', v)}
              />
              <ToggleSetting
                label="Show related articles"
                description="Display related news articles"
                checked={localSettings.showRelatedArticles}
                onChange={(v) => handleChange('showRelatedArticles', v)}
              />
              <ToggleSetting
                label="Show processing time"
                description="Display response generation timing"
                checked={localSettings.showTimings}
                onChange={(v) => handleChange('showTimings', v)}
              />
              <ToggleSetting
                label="Compact mode"
                description="Reduce spacing for more content"
                checked={localSettings.compactMode}
                onChange={(v) => handleChange('compactMode', v)}
              />
            </div>
          </section>

          {/* Input section */}
          <section>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Input
            </h3>
            <div className="space-y-4">
              <ToggleSetting
                label="Enable streaming"
                description="Show responses as they generate"
                checked={localSettings.streamingEnabled}
                onChange={(v) => handleChange('streamingEnabled', v)}
              />
              <ToggleSetting
                label="Voice input"
                description="Allow voice input via microphone"
                checked={localSettings.enableVoiceInput}
                onChange={(v) => handleChange('enableVoiceInput', v)}
              />
              <ToggleSetting
                label="Auto-scroll"
                description="Scroll to new messages automatically"
                checked={localSettings.autoScroll}
                onChange={(v) => handleChange('autoScroll', v)}
              />
            </div>
          </section>

          {/* Appearance section */}
          <section>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="space-y-4">
              {/* Font size */}
              <div>
                <p className="block text-sm text-white mb-2">Font size</p>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleChange('fontSize', size)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors capitalize ${
                        localSettings.fontSize === size
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <p className="block text-sm text-white mb-2">Theme</p>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleChange('theme', theme)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors capitalize ${
                        localSettings.theme === theme
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white 
                       border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}

// Toggle setting component
function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-white">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

export const SettingsPanel = memo(SettingsPanelComponent);
export default SettingsPanel;
