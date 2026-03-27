/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState, useCallback } from "react";

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  tier: string;
  active: boolean;
  rateLimitDay: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface NewKeyResponse {
  success: boolean;
  key: string;
  keyId: string;
  keyPrefix: string;
  tier: string;
  expiresAt: string;
  message: string;
}

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("Default");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function createKey() {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName, tier: "pro" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create key");
        return;
      }

      setNewKey(data);
      setShowCreate(false);
      fetchKeys();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId: string) {
    if (!confirm("Are you sure you want to revoke this key? This cannot be undone.")) return;

    setRevoking(keyId);
    try {
      const res = await fetch(`/api/dashboard/keys/${keyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch {
      // Fail silently
    } finally {
      setRevoking(null);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(d: string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function timeAgo(d: string | null): string {
    if (!d) return "Never";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">API Keys</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage your API keys.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
        >
          Create Key
        </button>
      </div>

      {/* New key created banner */}
      {newKey && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-500 text-lg">✓</span>
            <h3 className="font-semibold text-green-400">API Key Created</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Copy your API key now. <strong>It will not be shown again.</strong>
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm font-mono break-all">
              {newKey.key}
            </code>
            <button
              onClick={() => copyToClipboard(newKey.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create key dialog */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Create New API Key</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="key-name" className="block text-sm font-medium mb-1.5">
                Key Name
              </label>
              <input
                id="key-name"
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production, Testing"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createKey}
                disabled={creating || !keyName}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold transition-colors"
              >
                {creating ? "Creating..." : "Create Key"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setError(""); }}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="font-semibold mb-1">No API keys yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first API key to start using the API.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              Create Your First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Key
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{key.name}</td>
                    <td className="px-4 py-3">
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {key.keyPrefix}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          key.tier === "enterprise"
                            ? "bg-purple-500/10 text-purple-400"
                            : key.tier === "pro"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {key.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          key.active
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            key.active ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {key.active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {timeAgo(key.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {key.active && (
                        <button
                          onClick={() => revokeKey(key.id)}
                          disabled={revoking === key.id}
                          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                        >
                          {revoking === key.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
