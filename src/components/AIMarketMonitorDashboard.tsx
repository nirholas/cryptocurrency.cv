'use client';

/**
 * AI Market Monitor Dashboard
 *
 * Controls and displays output from the Autonomous Market Monitor.
 * Shows real-time alerts, regime detection, intelligence reports,
 * and market observations.
 *
 * @component AIMarketMonitorDashboard
 */

import React, { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonitorAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp: string;
  entities: string[];
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

interface MonitorStatus {
  running: boolean;
  memory?: {
    regime: string;
    alertCount: number;
    observationCount: number;
    reportCount: number;
    snapshotCount: number;
    uptime: number;
  };
}

interface MonitorReport {
  report: {
    title: string;
    timestamp: string;
    regime: string;
    sections: { heading: string; content: string }[];
    keyRisks: string[];
    opportunities: string[];
    watchlist: string[];
  };
}

// ---------------------------------------------------------------------------
// Severity styles
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'ℹ️' },
  low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: '🟢' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🟡' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: '🟠' },
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: '🔴' },
};

const REGIME_LABELS: Record<string, { label: string; color: string }> = {
  bull: { label: '🐂 Bull', color: 'text-green-400' },
  bear: { label: '🐻 Bear', color: 'text-red-400' },
  sideways: { label: '➡️ Sideways', color: 'text-yellow-400' },
  'high-volatility': { label: '🌊 High Volatility', color: 'text-orange-400' },
  'low-volatility': { label: '😴 Low Volatility', color: 'text-blue-400' },
  euphoria: { label: '🚀 Euphoria', color: 'text-emerald-400' },
  capitulation: { label: '💀 Capitulation', color: 'text-red-500' },
  unknown: { label: '❓ Analyzing', color: 'text-white/40' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIMarketMonitorDashboard() {
  const [status, setStatus] = useState<MonitorStatus>({ running: false });
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [report, setReport] = useState<MonitorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'alerts' | 'report'>('alerts');

  const apiCall = useCallback(async (action: string, body?: Record<string, unknown>) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/monitor?action=${action}`;
      const res = body
        ? await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const [statusData, alertsData] = await Promise.all([
      apiCall('status'),
      apiCall('alerts'),
    ]);
    if (statusData) setStatus(statusData);
    if (alertsData?.alerts) setAlerts(alertsData.alerts);
  }, [apiCall]);

  const handleStart = async () => {
    await apiCall('start');
    await refresh();
  };

  const handleStop = async () => {
    await apiCall('stop');
    await refresh();
  };

  const handleReport = async () => {
    const data = await apiCall('report');
    if (data?.report) {
      setReport(data);
      setTab('report');
    }
  };

  // Poll status when running
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const regime = status.memory?.regime || 'unknown';
  const regimeStyle = REGIME_LABELS[regime] || REGIME_LABELS.unknown;

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${status.running ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Autonomous Market Monitor</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className={status.running ? 'text-green-400' : 'text-white/30'}>
                {status.running ? '● Running' : '○ Stopped'}
              </span>
              {status.memory && (
                <>
                  <span className="text-white/20">|</span>
                  <span className={regimeStyle.color}>{regimeStyle.label}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-white/40">{status.memory.alertCount} alerts</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.running ? (
            <button onClick={handleStop} disabled={loading} className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50">
              ⏹ Stop
            </button>
          ) : (
            <button onClick={handleStart} disabled={loading} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-500 disabled:opacity-50">
              ▶ Start Monitor
            </button>
          )}
          <button onClick={handleReport} disabled={loading} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/20 disabled:opacity-50">
            📊 Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['alerts', 'report'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium transition ${tab === t ? 'border-b-2 border-violet-500 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            {t === 'alerts' ? `Alerts (${alerts.length})` : 'Intelligence Report'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 px-4 py-2 text-xs text-red-300">{error}</div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div className="max-h-[500px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-white/30">
              {status.running ? 'Monitoring... no alerts yet' : 'Start the monitor to detect alerts'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {alerts.map((alert, i) => {
                const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
                return (
                  <div
                    key={alert.id || i}
                    className={`px-4 py-3 ${style.bg} border-l-2 ${style.border}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{style.icon}</span>
                          <span className={`text-xs font-semibold ${style.text}`}>{alert.title}</span>
                          {alert.actionable && (
                            <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] text-violet-400">actionable</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-white/60">{alert.description}</p>
                        {alert.suggestedAction && (
                          <p className="mt-1 text-[10px] text-white/40">💡 {alert.suggestedAction}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] text-white/30">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/20">{Math.round(alert.confidence * 100)}% conf</div>
                      </div>
                    </div>
                    {alert.entities.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {alert.entities.map(e => (
                          <span key={e} className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Report tab */}
      {tab === 'report' && (
        <div className="max-h-[500px] overflow-y-auto p-4">
          {report?.report ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{report.report.title}</h3>
                <p className="text-[10px] text-white/30">{new Date(report.report.timestamp).toLocaleString()}</p>
                <span className={`text-xs ${REGIME_LABELS[report.report.regime]?.color || 'text-white/40'}`}>
                  Regime: {REGIME_LABELS[report.report.regime]?.label || report.report.regime}
                </span>
              </div>
              {report.report.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="mb-1 text-xs font-medium text-white/70">{s.heading}</h4>
                  <p className="text-xs leading-relaxed text-white/50">{s.content}</p>
                </div>
              ))}
              {report.report.keyRisks.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-red-400">⚠️ Key Risks</h4>
                  <ul className="list-disc pl-4 text-xs text-white/50">
                    {report.report.keyRisks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {report.report.opportunities.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-green-400">🎯 Opportunities</h4>
                  <ul className="list-disc pl-4 text-xs text-white/50">
                    {report.report.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
              {report.report.watchlist.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-medium text-yellow-400">👀 Watchlist</h4>
                  <div className="flex flex-wrap gap-1">
                    {report.report.watchlist.map(w => (
                      <span key={w} className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-white/30">
              Click &quot;Report&quot; to generate an intelligence report
            </div>
          )}
        </div>
      )}
    </div>
  );
}
