'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

interface RiskFactor {
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

interface ProtocolHealth {
  protocol: {
    id: string;
    name: string;
    slug: string;
    category: string;
    chains: string[];
    website: string;
    twitter?: string;
    description: string;
    isVerified: boolean;
  };
  riskScore: {
    overall: number;
    grade: string;
    factors: RiskFactor[];
    recommendations: string[];
    warnings: string[];
  };
  tvl: {
    current: number;
    change24h: number;
    change7d: number;
    change30d: number;
    rank: number;
    chains: Record<string, number>;
  };
  audits: Array<{
    auditor: string;
    date: string;
    rating: string;
    tier: string;
    findingsCount: number;
    openIssues: number;
  }>;
  incidents: Array<{
    date: string;
    type: string;
    severity: string;
    lossUsd: number;
    recoveredUsd: number;
    status: string;
  }>;
  insurance: {
    totalCoverage: number;
    coverageRatio: number;
    providers: string[];
  } | null;
  governance: {
    tokenSymbol: string;
    holderCount: number;
    concentration: number;
    voterParticipation: number;
    timelockHours: number;
    multisig: {
      signers: number;
      threshold: number;
      knownSigners: string[];
    } | null;
  } | null;
  team: {
    isDoxxed: boolean;
    teamSize: number;
    backers: string[];
    githubActivity: number;
  } | null;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    actionRequired: boolean;
  }>;
}

interface ProtocolRanking {
  rank: number;
  id: string;
  name: string;
  category: string;
  chains: string[];
  tvlUsd: number;
  riskScore: number;
  riskGrade: string;
  tvlChange24h: number;
}

interface SecurityIncident {
  id: string;
  protocol: string;
  date: string;
  type: string;
  severity: string;
  lossUsd: number;
  recoveredUsd: number;
  netLoss: number;
  attackVector: string;
  description: string;
  status: string;
}

type ViewTab = 'rankings' | 'protocol' | 'incidents' | 'compare';

// =============================================================================
// Helper Functions
// =============================================================================

function formatUsd(amount: number): string {
  if (amount >= 1e12) return `$${(amount / 1e12).toFixed(2)}T`;
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatPercent(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-500';
  if (grade.startsWith('B')) return 'text-blue-500';
  if (grade.startsWith('C')) return 'text-yellow-500';
  if (grade === 'D') return 'text-orange-500';
  return 'text-red-500';
}

function getGradeBgColor(grade: string): string {
  if (grade.startsWith('A')) return 'bg-green-500';
  if (grade.startsWith('B')) return 'bg-blue-500';
  if (grade.startsWith('C')) return 'bg-yellow-500';
  if (grade === 'D') return 'bg-orange-500';
  return 'bg-red-500';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'lending': '🏦',
    'dex': '🔄',
    'derivatives': '📊',
    'yield': '🌾',
    'bridge': '🌉',
    'cdp': '💵',
    'liquid-staking': '💧',
    'options': '📈',
    'insurance': '🛡️',
    'nft-marketplace': '🖼️',
    'gaming': '🎮',
    'launchpad': '🚀',
    'oracle': '🔮',
    'privacy': '🔒',
    'payments': '💳',
  };
  return icons[category] || '📦';
}

// =============================================================================
// Sub-Components
// =============================================================================

function RiskGaugeMeter({ score, grade }: { score: number; grade: string }) {
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Background arc */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-48 h-48 rounded-full border-[16px] border-gray-200 dark:border-slate-700" 
             style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />
      </div>
      
      {/* Colored segments */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-48 h-48 rounded-full" 
             style={{ 
               background: 'conic-gradient(from 180deg, #ef4444 0deg, #f97316 36deg, #eab308 72deg, #22c55e 108deg, #22c55e 180deg, transparent 180deg)',
               clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
             }} />
      </div>
      
      {/* Needle */}
      <div className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom -translate-x-1/2"
           style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}>
        <div className="w-1 h-16 bg-gray-900 dark:bg-white rounded-full" />
        <div className="w-3 h-3 bg-gray-900 dark:bg-white rounded-full -ml-1 -mt-1" />
      </div>
      
      {/* Center cover */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border-4 border-gray-200 dark:border-slate-600" />
      
      {/* Score display */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <span className={`text-3xl font-bold ${getGradeColor(grade)}`}>{grade}</span>
        <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">({score}/100)</span>
      </div>
    </div>
  );
}

function RiskFactorBar({ factor }: { factor: RiskFactor }) {
  const severityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{factor.name}</span>
        <span className={`text-sm font-bold ${factor.score >= 70 ? 'text-green-500' : factor.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
          {factor.score}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${severityColors[factor.severity]} transition-all duration-500`}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{factor.details}</p>
    </div>
  );
}

function ProtocolCard({ protocol, onClick }: { protocol: ProtocolRanking; onClick: () => void }) {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryIcon(protocol.category)}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{protocol.name}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{protocol.category.replace('-', ' ')}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeBgColor(protocol.riskGrade)} text-white`}>
          {protocol.riskGrade}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{formatUsd(protocol.tvlUsd)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">TVL</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${protocol.tvlChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(protocol.tvlChange24h)}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400">24h</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">#{protocol.rank}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Rank</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mt-3">
        {protocol.chains.slice(0, 3).map(chain => (
          <span key={chain} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-slate-300">
            {chain}
          </span>
        ))}
        {protocol.chains.length > 3 && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-slate-300">
            +{protocol.chains.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: SecurityIncident }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
            {incident.type.replace(/-/g, ' ')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{incident.protocol}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
          {incident.severity}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">{incident.description}</p>
      
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="font-bold text-red-500">{formatUsd(incident.lossUsd)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Loss</div>
        </div>
        <div>
          <div className="font-bold text-green-500">{formatUsd(incident.recoveredUsd)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Recovered</div>
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{formatDate(incident.date)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Date</div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-slate-400">{incident.attackVector}</span>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          incident.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          incident.status === 'investigating' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {incident.status}
        </span>
      </div>
    </div>
  );
}

function ProtocolDetailView({ health, onBack }: { health: ProtocolHealth; onBack: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getCategoryIcon(health.protocol.category)}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{health.protocol.name}</h2>
            <p className="text-gray-500 dark:text-slate-400 capitalize">{health.protocol.category.replace('-', ' ')}</p>
          </div>
        </div>
        {health.protocol.isVerified && (
          <span className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <div className="space-y-2">
          {health.alerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-3 rounded-lg border ${
                alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' :
                alert.severity === 'danger' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' :
                'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="font-medium text-gray-900 dark:text-white">{alert.title}</span>
                {alert.actionRequired && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">Action Required</span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Risk Score */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Safety Score</h3>
          <RiskGaugeMeter score={health.riskScore.overall} grade={health.riskScore.grade} />
          <div className="mt-8 space-y-1">
            {health.riskScore.factors.slice(0, 5).map(factor => (
              <RiskFactorBar key={factor.name} factor={factor} />
            ))}
          </div>
        </div>

        {/* TVL & Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">TVL & Performance</h3>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatUsd(health.tvl.current)}</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">Total Value Locked</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div>
              <div className={`font-bold ${health.tvl.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(health.tvl.change24h)}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">24h</div>
            </div>
            <div>
              <div className={`font-bold ${health.tvl.change7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(health.tvl.change7d)}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">7d</div>
            </div>
            <div>
              <div className={`font-bold ${health.tvl.change30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(health.tvl.change30d)}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">30d</div>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Chain Distribution</h4>
          <div className="space-y-2">
            {Object.entries(health.tvl.chains).slice(0, 4).map(([chain, value]) => (
              <div key={chain} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">{chain}</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatUsd(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audits & Team */}
        <div className="space-y-4">
          {/* Audits */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Security Audits</h3>
            {health.audits.length === 0 ? (
              <p className="text-sm text-red-500">⚠️ No audits on file</p>
            ) : (
              <div className="space-y-2">
                {health.audits.map((audit, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{audit.auditor}</span>
                      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                        audit.tier === 'tier1' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        audit.tier === 'tier2' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {audit.tier}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      audit.rating === 'pass' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {audit.rating}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Insurance Coverage</h3>
            {!health.insurance ? (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">⚠️ No insurance coverage</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatUsd(health.insurance.totalCoverage)}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {(health.insurance.coverageRatio * 100).toFixed(1)}% of TVL covered
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {health.insurance.providers.map(p => (
                    <span key={p} className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                      🛡️ {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Team */}
          {health.team && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Team</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Identity</span>
                  <span className={health.team.isDoxxed ? 'text-green-500' : 'text-yellow-500'}>
                    {health.team.isDoxxed ? '✅ Doxxed' : '⚠️ Anonymous'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Team Size</span>
                  <span className="text-gray-900 dark:text-white">{health.team.teamSize} members</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">GitHub (30d)</span>
                  <span className="text-gray-900 dark:text-white">{health.team.githubActivity} commits</span>
                </div>
                {health.team.backers.length > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Backers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {health.team.backers.slice(0, 3).map(b => (
                        <span key={b} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations & Warnings */}
      {(health.riskScore.warnings.length > 0 || health.riskScore.recommendations.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {health.riskScore.warnings.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                <span>⚠️</span> Warnings
              </h3>
              <ul className="space-y-1">
                {health.riskScore.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-400">• {w}</li>
                ))}
              </ul>
            </div>
          )}
          {health.riskScore.recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <span>💡</span> Recommendations
              </h3>
              <ul className="space-y-1">
                {health.riskScore.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-blue-700 dark:text-blue-400">• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Incidents */}
      {health.incidents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Incidents History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Loss</th>
                  <th className="pb-2">Recovered</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {health.incidents.map((incident, i) => (
                  <tr key={i} className="border-b dark:border-slate-700">
                    <td className="py-2">{formatDate(incident.date)}</td>
                    <td className="py-2 capitalize">{incident.type.replace(/-/g, ' ')}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="py-2 text-red-500">{formatUsd(incident.lossUsd)}</td>
                    <td className="py-2 text-green-500">{formatUsd(incident.recoveredUsd)}</td>
                    <td className="py-2 capitalize">{incident.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ProtocolHealthDashboard() {
  const [activeTab, setActiveTab] = useState<ViewTab>('rankings');
  const [rankings, setRankings] = useState<ProtocolRanking[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRankings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ action: 'ranking', limit: '50' });
      if (categoryFilter) params.set('category', categoryFilter);
      
      const response = await fetch(`/api/defi/protocol-health?${params}`);
      if (!response.ok) throw new Error('Failed to fetch rankings');
      
      const data = await response.json();
      setRankings(data.data.protocols);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch('/api/defi/protocol-health?action=incidents&limit=20');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      
      const data = await response.json();
      setIncidents(data.data.incidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  }, []);

  const fetchProtocolDetail = useCallback(async (protocolId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/defi/protocol-health?protocol=${protocolId}`);
      if (!response.ok) throw new Error('Failed to fetch protocol');
      
      const data = await response.json();
      setSelectedProtocol(data.data);
      setActiveTab('protocol');
    } catch (err) {
      console.error('Failed to fetch protocol:', err);
      setError(err instanceof Error ? err.message : 'Failed to load protocol');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
    fetchIncidents();
  }, [fetchRankings, fetchIncidents]);

  const filteredRankings = useMemo(() => {
    if (!searchQuery) return rankings;
    const query = searchQuery.toLowerCase();
    return rankings.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.includes(query)
    );
  }, [rankings, searchQuery]);

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'lending', name: '🏦 Lending' },
    { id: 'dex', name: '🔄 DEX' },
    { id: 'derivatives', name: '📊 Derivatives' },
    { id: 'yield', name: '🌾 Yield' },
    { id: 'bridge', name: '🌉 Bridge' },
    { id: 'liquid-staking', name: '💧 Liquid Staking' },
    { id: 'cdp', name: '💵 CDP' },
  ];

  if (loading && rankings.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && rankings.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchRankings} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  // Protocol detail view
  if (activeTab === 'protocol' && selectedProtocol) {
    return (
      <ProtocolDetailView 
        health={selectedProtocol} 
        onBack={() => {
          setSelectedProtocol(null);
          setActiveTab('rankings');
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('rankings')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rankings' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
          }`}
        >
          🏆 Protocol Rankings
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'incidents' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
          }`}
        >
          🚨 Security Incidents
        </button>
      </div>

      {activeTab === 'rankings' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search protocols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{rankings.length}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Protocols Tracked</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {rankings.filter(r => r.riskGrade.startsWith('A') || r.riskGrade.startsWith('B')).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Safe (A/B Grade)</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {rankings.filter(r => r.riskGrade.startsWith('C')).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Moderate Risk (C)</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {rankings.filter(r => r.riskGrade === 'D' || r.riskGrade === 'F').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">High Risk (D/F)</div>
            </div>
          </div>

          {/* Protocol Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRankings.map(protocol => (
              <ProtocolCard 
                key={protocol.id} 
                protocol={protocol}
                onClick={() => fetchProtocolDetail(protocol.id)}
              />
            ))}
          </div>

          {filteredRankings.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              No protocols found matching your criteria
            </div>
          )}
        </>
      )}

      {activeTab === 'incidents' && (
        <div className="grid md:grid-cols-2 gap-4">
          {incidents.map(incident => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
          {incidents.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500 dark:text-slate-400">
              No recent security incidents
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProtocolHealthDashboard;
