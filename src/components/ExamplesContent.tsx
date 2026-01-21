'use client';

import React, { useState } from 'react';

interface Example {
  id: string;
  name: string;
  icon: string;
  description: string;
  language: string;
  filename: string;
  setup?: string;
  envVars?: string[];
  code: string;
}

interface ExamplesContentProps {
  examples: Example[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center gap-1.5"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function ExampleCard({ example, isSelected, onClick }: { example: Example; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-black bg-black text-white'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{example.icon}</span>
        <div>
          <h3 className="font-semibold">{example.name}</h3>
          <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
            {example.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function LanguageBadge({ language }: { language: string }) {
  const colors: Record<string, string> = {
    bash: 'bg-green-100 text-green-800',
    javascript: 'bg-yellow-100 text-yellow-800',
    python: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[language] || 'bg-gray-100 text-gray-800'}`}>
      {language}
    </span>
  );
}

export function ExamplesContent({ examples }: ExamplesContentProps) {
  const [selectedId, setSelectedId] = useState(examples[0]?.id || '');
  const selectedExample = examples.find((e) => e.id === selectedId) || examples[0];

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-8">
      {/* Sidebar */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Choose an Example
        </h2>
        {examples.map((example) => (
          <ExampleCard
            key={example.id}
            example={example}
            isSelected={selectedId === example.id}
            onClick={() => setSelectedId(example.id)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedExample.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{selectedExample.name}</h2>
                <p className="text-gray-600">{selectedExample.description}</p>
              </div>
            </div>
            <LanguageBadge language={selectedExample.language} />
          </div>

          {/* Setup instructions */}
          {(selectedExample.setup || selectedExample.envVars) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Setup</h3>
              {selectedExample.setup && (
                <div className="mb-2">
                  <code className="text-sm bg-blue-100 px-2 py-1 rounded text-blue-800">
                    {selectedExample.setup}
                  </code>
                </div>
              )}
              {selectedExample.envVars && (
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Environment variables: </span>
                  {selectedExample.envVars.map((v) => (
                    <code key={v} className="bg-blue-100 px-1 rounded mr-1">
                      {v}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Block */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-10 bg-gray-800 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-sm ml-2">{selectedExample.filename}</span>
          </div>
          <CopyButton text={selectedExample.code} />
          <pre className="bg-gray-900 text-gray-100 p-6 pt-14 overflow-x-auto text-sm leading-relaxed">
            <code>{selectedExample.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              💡 No API key required — works out of the box!
            </span>
            <a
              href={`https://github.com/nirholas/free-crypto-news/blob/main/examples/${selectedExample.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View on GitHub
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
