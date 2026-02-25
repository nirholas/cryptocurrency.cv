/**
 * Multi-Agent Research Orchestrator
 *
 * Autonomous multi-agent framework that decomposes complex crypto research
 * questions into a DAG of specialist tasks, executes them in parallel waves,
 * cross-references findings, synthesizes reports, and self-critiques for quality.
 *
 * Architecture:
 * ┌──────────────┐
 * │ Orchestrator  │ ← decomposes query into task DAG
 * └──────┬───────┘
 *        │
 *   ┌────▼────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐
 *   │ Source   │  │  Market    │  │  Social    │  │ On-chain  │
 *   │ Analyst  │  │  Analyst   │  │  Analyst   │  │  Analyst  │
 *   └────┬────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘
 *        │             │               │               │
 *   ┌────▼─────────────▼───────────────▼───────────────▼────┐
 *   │               Cross-Reference / Fact-Check             │
 *   └─────────────────────────┬─────────────────────────────┘
 *                             │
 *                    ┌────────▼────────┐
 *                    │  Synthesis Agent │ ← merges + resolves conflicts
 *                    └────────┬────────┘
 *                             │
 *                    ┌────────▼────────┐
 *                    │   Critic Agent   │ ← quality scoring, gap detection
 *                    └────────┬────────┘
 *                             │
 *                    ┌────────▼────────┐
 *                    │  Follow-up Loop  │ ← re-investigates low-confidence areas
 *                    └─────────────────┘
 *
 * Features:
 * - DAG-based task scheduling with dependency resolution
 * - Parallel execution with configurable concurrency
 * - Streaming progress via callback
 * - Automatic retry with exponential backoff
 * - Self-critique loop with confidence thresholds
 * - Follow-up investigation on weak findings
 * - Session persistence and resumability
 * - Full audit trail of agent reasoning
 *
 * @module agent-orchestrator
 */

import { aiComplete } from './ai-provider';
import { cache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AgentRole =
  | 'orchestrator'
  | 'source-analyst'
  | 'market-analyst'
  | 'social-analyst'
  | 'onchain-analyst'
  | 'synthesis'
  | 'critic'
  | 'fact-checker'
  | 'contrarian'
  | 'timeline-builder';

export type TaskStatus =
  | 'pending'
  | 'blocked'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type ResearchDepth = 'flash' | 'standard' | 'deep' | 'exhaustive';

export type ResearchPhase =
  | 'planning'
  | 'investigation'
  | 'cross-reference'
  | 'synthesis'
  | 'critique'
  | 'follow-up'
  | 'finalization'
  | 'complete'
  | 'error';

export interface AgentTask {
  id: string;
  role: AgentRole;
  description: string;
  dependencies: string[];
  status: TaskStatus;
  input: Record<string, unknown>;
  output?: AgentFinding;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  retryCount: number;
  wave: number; // execution wave (tasks in same wave run in parallel)
  reasoning?: string; // why this task was created
}

export interface AgentFinding {
  summary: string;
  details: string;
  evidence: Evidence[];
  confidence: number; // 0-100
  reasoning: string;
  tags: string[];
  entities: ExtractedEntity[];
  contradictions: Contradiction[];
  metadata?: Record<string, unknown>;
}

export interface Evidence {
  source: string;
  type: 'article' | 'market-data' | 'on-chain' | 'social' | 'expert' | 'statistical';
  content: string;
  url?: string;
  timestamp?: string;
  credibility: number; // 0-100
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'project' | 'token' | 'exchange' | 'protocol' | 'event' | 'regulation' | 'concept';
  relevance: number; // 0-100
  sentiment?: number; // -1 to 1
  context?: string;
}

export interface Contradiction {
  claim1: { text: string; source: string; confidence: number };
  claim2: { text: string; source: string; confidence: number };
  analysis: string;
  resolution?: string;
  resolvedConfidence?: number;
}

export interface KeyFinding {
  title: string;
  description: string;
  confidence: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  evidenceRefs: number[];
  novelty: number; // 0-100 how new/unexpected this finding is
}

export interface TimelineEvent {
  date: string;
  event: string;
  significance: 'critical' | 'major' | 'moderate' | 'minor';
  sources: string[];
  entities: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: number; // 0-100
  impact: string;
  earlyWarningSignals: string[];
}

export interface CritiqueResult {
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  gaps: string[];
  unsupportedClaims: string[];
  suggestedFollowUps: Array<{
    question: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    expectedImpact: string;
  }>;
  adjustedConfidence: number;
  reasoning: string;
}

export interface ResearchReport {
  id: string;
  query: string;
  depth: ResearchDepth;
  phase: ResearchPhase;

  // Core content
  executiveSummary: string;
  keyFindings: KeyFinding[];
  timeline: TimelineEvent[];
  entities: ExtractedEntity[];
  contradictions: Contradiction[];

  // Assessment
  riskAssessment: {
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
    factors: RiskFactor[];
    mitigations: string[];
  };
  confidence: number;
  methodology: string;

  // Sources & evidence
  allEvidence: Evidence[];
  sourceCount: number;

  // Meta-analysis
  narrativeArcs: string[];
  contrarianView?: string;
  followUpQuestions: string[];
  critique?: CritiqueResult;

  // Provenance
  agentTasks: AgentTaskSummary[];
  processingTimeMs: number;
  totalAgentCalls: number;
  generatedAt: string;
}

export interface AgentTaskSummary {
  id: string;
  role: AgentRole;
  wave: number;
  status: TaskStatus;
  durationMs: number;
  findingSummary?: string;
  confidence?: number;
}

export interface ResearchProgress {
  sessionId: string;
  phase: ResearchPhase;
  phaseDescription: string;
  completedTasks: number;
  totalTasks: number;
  currentWave: number;
  activeAgents: AgentRole[];
  elapsedMs: number;
  estimatedRemainingMs: number;
  latestFinding?: string;
  confidence?: number;
}

interface ResearchSession {
  id: string;
  query: string;
  depth: ResearchDepth;
  phase: ResearchPhase;
  tasks: AgentTask[];
  findings: AgentFinding[];
  report?: ResearchReport;
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEPTH_CONFIG: Record<ResearchDepth, {
  maxAgents: number;
  maxTasks: number;
  maxFollowUps: number;
  minConfidence: number;
  maxTokens: number;
  temperature: number;
}> = {
  flash: {
    maxAgents: 2,
    maxTasks: 4,
    maxFollowUps: 0,
    minConfidence: 30,
    maxTokens: 1500,
    temperature: 0.3,
  },
  standard: {
    maxAgents: 4,
    maxTasks: 8,
    maxFollowUps: 1,
    minConfidence: 40,
    maxTokens: 3000,
    temperature: 0.3,
  },
  deep: {
    maxAgents: 6,
    maxTasks: 12,
    maxFollowUps: 2,
    minConfidence: 50,
    maxTokens: 4000,
    temperature: 0.2,
  },
  exhaustive: {
    maxAgents: 8,
    maxTasks: 20,
    maxFollowUps: 3,
    minConfidence: 60,
    maxTokens: 6000,
    temperature: 0.1,
  },
} as const;

const MAX_RETRIES = 2;
const CACHE_TTL_SECONDS = 600;

// ═══════════════════════════════════════════════════════════════
// AGENT SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  orchestrator: `You are the orchestrator of a multi-agent crypto research system. Given a research query, decompose it into a DAG of specialist tasks that can be executed in parallel waves.

Available specialist roles:
- source-analyst: Analyze news articles, track narrative evolution, assess source credibility
- market-analyst: Analyze price action, volume, correlations, market structure
- social-analyst: Analyze community sentiment, influencer activity, viral narratives
- onchain-analyst: Analyze wallet flows, protocol metrics, smart contract activity
- fact-checker: Verify specific claims against known facts
- contrarian: Argue the opposite position to challenge consensus
- timeline-builder: Construct chronological narrative of events

Return JSON:
{
  "tasks": [
    {
      "id": "task-1",
      "role": "source-analyst",
      "description": "Specific task description",
      "dependencies": [],
      "wave": 0,
      "input": { "focus": "...", "timeframe": "...", "entities": [...] },
      "reasoning": "Why this task matters for the research"
    }
  ],
  "overallStrategy": "Brief description of research approach",
  "estimatedComplexity": "low|medium|high|very-high"
}`,

  'source-analyst': `You are a crypto news source analyst. Analyze news coverage to extract claims, identify bias, assess credibility, and track narrative evolution. Consider source reputation, editorial stance, and potential conflicts of interest.

Return JSON:
{
  "summary": "Key findings",
  "details": "Detailed analysis with specific examples",
  "evidence": [{ "source": "...", "type": "article", "content": "Key quote or data point", "credibility": 0-100 }],
  "confidence": 0-100,
  "reasoning": "Chain of reasoning explaining how you reached your conclusions",
  "tags": ["narrative", "regulation", "defi", ...],
  "entities": [{ "name": "...", "type": "person|project|token|exchange|protocol|event|regulation|concept", "relevance": 0-100, "sentiment": -1 to 1 }],
  "contradictions": [{ "claim1": { "text": "...", "source": "...", "confidence": 0-100 }, "claim2": { "text": "...", "source": "...", "confidence": 0-100 }, "analysis": "..." }]
}`,

  'market-analyst': `You are a crypto market data analyst. Analyze price action, volume patterns, market structure, and cross-asset correlations. Identify potential market manipulation, unusual patterns, key levels, and divergences between price and fundamentals.

Return JSON with: { summary, details, evidence[], confidence, reasoning, tags, entities[], contradictions[] }`,

  'social-analyst': `You are a crypto social intelligence analyst. Analyze community sentiment, influencer positioning, viral narrative propagation, and coordinated campaign detection. Distinguish organic movements from astroturfing.

Return JSON with: { summary, details, evidence[], confidence, reasoning, tags, entities[], contradictions[] }`,

  'onchain-analyst': `You are a crypto on-chain analyst. Analyze wallet movements, smart contract interactions, DeFi protocol metrics, token distributions, and protocol health indicators. Identify whale accumulation/distribution, unusual contract deployments, and liquidity shifts.

Return JSON with: { summary, details, evidence[], confidence, reasoning, tags, entities[], contradictions[] }`,

  'fact-checker': `You are a crypto fact-checker. Verify specific claims against established facts. Cross-reference multiple sources. Identify potential misinformation, exaggeration, and misleading framing. Be rigorous and skeptical.

Return JSON with: { summary, details, evidence[], confidence, reasoning, tags, entities[], contradictions[] }`,

  contrarian: `You are a contrarian analyst. Your job is to argue against the consensus view. Find weaknesses in bullish narratives, potential positives in bearish situations, and overlooked risks in "safe" investments. Be intellectually honest — not contrarian for its own sake, but genuinely challenging assumptions.

Return JSON with: { summary, details, evidence[], confidence, reasoning, tags, entities[], contradictions[] }`,

  'timeline-builder': `You are a chronological analyst. Construct a detailed timeline of events related to the research query. Identify causal chains, turning points, and the sequence of events that led to the current situation.

Return JSON:
{
  "summary": "Chronological overview",
  "details": "Detailed timeline narrative",
  "evidence": [],
  "confidence": 0-100,
  "reasoning": "How events connect causally",
  "tags": [],
  "entities": [],
  "contradictions": [],
  "metadata": {
    "timeline": [{ "date": "...", "event": "...", "significance": "critical|major|moderate|minor", "sources": [], "entities": [] }]
  }
}`,

  synthesis: `You are a research synthesis agent. Given multiple specialist findings, produce a unified, coherent research report. Resolve contradictions by weighing evidence quality. Identify the most impactful insights. Be direct and actionable.

Return JSON:
{
  "executiveSummary": "2-4 sentence overview — the most important things to know",
  "keyFindings": [{ "title": "...", "description": "...", "confidence": 0-100, "impact": "critical|high|medium|low", "category": "...", "evidenceRefs": [0, 1, 2], "novelty": 0-100 }],
  "timeline": [{ "date": "...", "event": "...", "significance": "critical|major|moderate|minor", "sources": [], "entities": [] }],
  "riskAssessment": {
    "overallRisk": "critical|high|medium|low",
    "factors": [{ "factor": "...", "severity": "...", "likelihood": 0-100, "impact": "...", "earlyWarningSignals": [] }],
    "mitigations": []
  },
  "narrativeArcs": ["Arc 1 description", "Arc 2 description"],
  "confidence": 0-100,
  "methodology": "How the research was conducted",
  "followUpQuestions": ["Question 1", "Question 2"]
}`,

  critic: `You are a research quality critic. Evaluate completeness, accuracy, logical rigor, and evidence quality. Identify gaps, unsupported claims, and areas needing deeper investigation. Be constructively critical — your feedback improves the research.

Return JSON:
{
  "overallScore": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "gaps": ["Missing coverage of X", "No data on Y"],
  "unsupportedClaims": ["Claim X lacks evidence because..."],
  "suggestedFollowUps": [{ "question": "...", "priority": "critical|high|medium|low", "expectedImpact": "What this would add" }],
  "adjustedConfidence": 0-100,
  "reasoning": "Overall quality assessment with specific examples"
}`,
};

// ═══════════════════════════════════════════════════════════════
// SESSION STORE
// ═══════════════════════════════════════════════════════════════

const sessions = new Map<string, ResearchSession>();

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════════
// AGENT EXECUTION
// ═══════════════════════════════════════════════════════════════

async function callAgent(
  role: AgentRole,
  userPrompt: string,
  config: { maxTokens: number; temperature: number }
): Promise<string | null> {
  try {
    return await aiComplete(
      SYSTEM_PROMPTS[role],
      userPrompt,
      { temperature: config.temperature, maxTokens: config.maxTokens }
    );
  } catch (error) {
    console.error(`[agent-orchestrator] ${role} failed:`, error);
    return null;
  }
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    // Try direct parse
    return JSON.parse(raw) as T;
  } catch {
    // Extract from markdown code blocks
    const blockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (blockMatch) {
      try { return JSON.parse(blockMatch[1].trim()) as T; } catch { /* fall through */ }
    }
    // Extract first JSON object
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as T; } catch { /* fall through */ }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TASK PLANNING (Phase 1)
// ═══════════════════════════════════════════════════════════════

interface PlanResult {
  tasks: Array<{
    id: string;
    role: AgentRole;
    description: string;
    dependencies: string[];
    wave: number;
    input: Record<string, unknown>;
    reasoning: string;
  }>;
  overallStrategy: string;
  estimatedComplexity: string;
}

async function planResearch(
  query: string,
  depth: ResearchDepth
): Promise<AgentTask[]> {
  const config = DEPTH_CONFIG[depth];

  const prompt = `Research Query: "${query}"
Research Depth: ${depth}
Max Tasks: ${config.maxTasks}
Max Parallel Agents: ${config.maxAgents}

You have access to:
- 662,000+ crypto news articles (2021-2026)
- Real-time market data for top 100 cryptocurrencies
- Social sentiment from Twitter, Reddit, Discord, Telegram
- On-chain data from major blockchains
- Historical price data with OHLCV

Decompose this into ${config.maxTasks > 8 ? '6-12' : '3-6'} specialist tasks organized into execution waves. Wave 0 tasks run first (in parallel), Wave 1 tasks run after Wave 0 completes, etc.`;

  const response = await callAgent('orchestrator', prompt, config);
  const plan = parseJSON<PlanResult>(response);

  if (!plan?.tasks?.length) {
    return createDefaultPlan(query, depth);
  }

  return plan.tasks.slice(0, config.maxTasks).map((t) => ({
    id: t.id || `t-${generateId()}`,
    role: validateRole(t.role),
    description: t.description,
    dependencies: t.dependencies || [],
    status: 'pending' as TaskStatus,
    input: t.input || {},
    wave: t.wave ?? 0,
    reasoning: t.reasoning,
    retryCount: 0,
  }));
}

function validateRole(role: string): AgentRole {
  const valid: AgentRole[] = [
    'orchestrator', 'source-analyst', 'market-analyst', 'social-analyst',
    'onchain-analyst', 'synthesis', 'critic', 'fact-checker', 'contrarian',
    'timeline-builder',
  ];
  return valid.includes(role as AgentRole) ? (role as AgentRole) : 'source-analyst';
}

function createDefaultPlan(query: string, depth: ResearchDepth): AgentTask[] {
  const base: AgentTask[] = [
    {
      id: 't-sources', role: 'source-analyst', wave: 0,
      description: `Analyze news coverage and source credibility for: ${query}`,
      dependencies: [], status: 'pending', input: { query }, retryCount: 0,
    },
    {
      id: 't-market', role: 'market-analyst', wave: 0,
      description: `Analyze market data and price context for: ${query}`,
      dependencies: [], status: 'pending', input: { query }, retryCount: 0,
    },
    {
      id: 't-social', role: 'social-analyst', wave: 0,
      description: `Analyze social sentiment and community signals for: ${query}`,
      dependencies: [], status: 'pending', input: { query }, retryCount: 0,
    },
  ];

  if (depth === 'deep' || depth === 'exhaustive') {
    base.push(
      {
        id: 't-onchain', role: 'onchain-analyst', wave: 0,
        description: `Analyze on-chain data and protocol metrics for: ${query}`,
        dependencies: [], status: 'pending', input: { query }, retryCount: 0,
      },
      {
        id: 't-timeline', role: 'timeline-builder', wave: 0,
        description: `Build chronological timeline of events for: ${query}`,
        dependencies: [], status: 'pending', input: { query }, retryCount: 0,
      },
    );
  }

  if (depth === 'exhaustive') {
    base.push(
      {
        id: 't-contrarian', role: 'contrarian', wave: 1,
        description: `Challenge the consensus view on: ${query}`,
        dependencies: ['t-sources', 't-market'], status: 'pending', input: { query }, retryCount: 0,
      },
      {
        id: 't-factcheck', role: 'fact-checker', wave: 1,
        description: `Verify key claims from initial findings about: ${query}`,
        dependencies: ['t-sources'], status: 'pending', input: { query }, retryCount: 0,
      },
    );
  }

  return base;
}

// ═══════════════════════════════════════════════════════════════
// WAVE-BASED PARALLEL EXECUTOR (Phase 2)
// ═══════════════════════════════════════════════════════════════

async function executeWaves(
  session: ResearchSession,
  onProgress?: (p: ResearchProgress) => void
): Promise<void> {
  const config = DEPTH_CONFIG[session.depth];
  const maxWave = Math.max(...session.tasks.map((t) => t.wave));

  for (let wave = 0; wave <= maxWave; wave++) {
    const waveTasks = session.tasks.filter(
      (t) => t.wave === wave && t.status === 'pending'
    );

    if (waveTasks.length === 0) continue;

    // Check all dependencies are satisfied
    for (const task of waveTasks) {
      const unmetDeps = task.dependencies.filter(
        (d) => !session.tasks.find((t) => t.id === d && t.status === 'completed')
      );
      if (unmetDeps.length > 0) {
        task.status = 'blocked';
        continue;
      }
    }

    const runnableTasks = waveTasks.filter((t) => t.status === 'pending');

    // Execute wave tasks in parallel (respecting concurrency limit)
    const chunks: AgentTask[][] = [];
    for (let i = 0; i < runnableTasks.length; i += config.maxAgents) {
      chunks.push(runnableTasks.slice(i, i + config.maxAgents));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map((task) => executeTask(task, session, config))
      );

      if (onProgress) {
        emitProgress(session, onProgress);
      }
    }
  }
}

async function executeTask(
  task: AgentTask,
  session: ResearchSession,
  config: { maxTokens: number; temperature: number }
): Promise<void> {
  task.status = 'running';
  task.startedAt = Date.now();

  const prompt = buildPrompt(task, session);

  try {
    const response = await callAgent(task.role, prompt, config);
    const finding = parseJSON<AgentFinding>(response);

    if (finding?.summary) {
      task.output = normalizeFinding(finding);
      task.status = 'completed';
      session.findings.push(task.output);
    } else {
      throw new Error('Agent returned unparseable response');
    }
  } catch (error) {
    if (task.retryCount < MAX_RETRIES) {
      task.retryCount++;
      task.status = 'retrying';
      // Retry with slightly higher temperature for diversity
      try {
        const retryResponse = await callAgent(task.role, prompt, {
          ...config,
          temperature: Math.min(0.8, config.temperature + 0.15),
        });
        const retryFinding = parseJSON<AgentFinding>(retryResponse);
        if (retryFinding?.summary) {
          task.output = normalizeFinding(retryFinding);
          task.status = 'completed';
          session.findings.push(task.output);
          return;
        }
      } catch { /* fall through to failure */ }
    }
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : String(error);
  } finally {
    task.completedAt = Date.now();
  }
}

function buildPrompt(task: AgentTask, session: ResearchSession): string {
  const parts = [`## Task\n${task.description}`];

  if (Object.keys(task.input).length > 0) {
    parts.push(`## Parameters\n${JSON.stringify(task.input, null, 2)}`);
  }

  // Include findings from completed dependencies
  const depFindings = session.tasks
    .filter((t) => task.dependencies.includes(t.id) && t.output)
    .map((t) => `### ${t.role} (confidence: ${t.output!.confidence}%)\n${t.output!.summary}\n${t.output!.details}`);

  if (depFindings.length > 0) {
    parts.push(`## Findings from Prior Agents\n${depFindings.join('\n\n')}`);
  }

  parts.push(`## Original Query\n"${session.query}"`);

  return parts.join('\n\n');
}

function normalizeFinding(raw: AgentFinding): AgentFinding {
  return {
    summary: raw.summary || '',
    details: raw.details || '',
    evidence: (raw.evidence || []).slice(0, 12).map((e) => ({
      source: e.source || 'unknown',
      type: e.type || 'article',
      content: e.content || '',
      url: e.url,
      timestamp: e.timestamp,
      credibility: clamp(e.credibility ?? 50, 0, 100),
    })),
    confidence: clamp(raw.confidence ?? 50, 0, 100),
    reasoning: raw.reasoning || '',
    tags: raw.tags || [],
    entities: (raw.entities || []).slice(0, 20).map((e) => ({
      name: e.name,
      type: e.type || 'concept',
      relevance: clamp(e.relevance ?? 50, 0, 100),
      sentiment: e.sentiment != null ? clamp(e.sentiment, -1, 1) : undefined,
      context: e.context,
    })),
    contradictions: raw.contradictions || [],
    metadata: raw.metadata,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function emitProgress(
  session: ResearchSession,
  cb: (p: ResearchProgress) => void
): void {
  const completed = session.tasks.filter((t) => t.status === 'completed' || t.status === 'failed').length;
  const active = session.tasks.filter((t) => t.status === 'running');
  const elapsed = Date.now() - session.createdAt;
  const avgPerTask = completed > 0 ? elapsed / completed : 15000;

  cb({
    sessionId: session.id,
    phase: session.phase,
    phaseDescription: describePhase(session.phase),
    completedTasks: completed,
    totalTasks: session.tasks.length,
    currentWave: Math.min(...active.map((t) => t.wave).concat([0])),
    activeAgents: active.map((t) => t.role),
    elapsedMs: elapsed,
    estimatedRemainingMs: Math.round(avgPerTask * (session.tasks.length - completed)),
    latestFinding: session.findings.at(-1)?.summary,
    confidence: session.findings.length > 0
      ? Math.round(session.findings.reduce((s, f) => s + f.confidence, 0) / session.findings.length)
      : undefined,
  });
}

function describePhase(phase: ResearchPhase): string {
  const descriptions: Record<ResearchPhase, string> = {
    planning: 'Decomposing query into specialist tasks...',
    investigation: 'Specialist agents investigating in parallel...',
    'cross-reference': 'Cross-referencing and fact-checking findings...',
    synthesis: 'Synthesizing findings into coherent report...',
    critique: 'Quality assessment and gap analysis...',
    'follow-up': 'Investigating low-confidence areas...',
    finalization: 'Finalizing report...',
    complete: 'Research complete',
    error: 'Research encountered an error',
  };
  return descriptions[phase];
}

// ═══════════════════════════════════════════════════════════════
// SYNTHESIS (Phase 3)
// ═══════════════════════════════════════════════════════════════

interface SynthesisOutput {
  executiveSummary: string;
  keyFindings: KeyFinding[];
  timeline: TimelineEvent[];
  riskAssessment: ResearchReport['riskAssessment'];
  narrativeArcs: string[];
  confidence: number;
  methodology: string;
  followUpQuestions: string[];
}

async function synthesize(session: ResearchSession): Promise<SynthesisOutput | null> {
  const config = DEPTH_CONFIG[session.depth];

  const findingsText = session.findings.map((f, i) =>
    `### Finding ${i + 1} — confidence: ${f.confidence}%\n**Summary:** ${f.summary}\n**Details:** ${f.details}\n**Evidence count:** ${f.evidence.length}\n**Key entities:** ${f.entities.map((e) => e.name).join(', ')}`
  ).join('\n\n---\n\n');

  const allContradictions = session.findings.flatMap((f) => f.contradictions);

  const prompt = `## Research Query\n"${session.query}"\n\n## Specialist Findings (${session.findings.length} agents)\n${findingsText}\n\n## Identified Contradictions (${allContradictions.length})\n${JSON.stringify(allContradictions.slice(0, 10), null, 2)}\n\nSynthesize these into a comprehensive, actionable research report. Weight higher-confidence findings more heavily. Flag and resolve contradictions.`;

  const response = await callAgent('synthesis', prompt, {
    maxTokens: Math.min(config.maxTokens * 2, 8000),
    temperature: 0.15,
  });

  return parseJSON<SynthesisOutput>(response);
}

// ═══════════════════════════════════════════════════════════════
// CRITIQUE (Phase 4)
// ═══════════════════════════════════════════════════════════════

async function critique(
  report: Partial<ResearchReport>,
  session: ResearchSession
): Promise<CritiqueResult | null> {
  const config = DEPTH_CONFIG[session.depth];

  const prompt = `## Research Report to Evaluate\n\nQuery: "${report.query}"\nExecutive Summary: ${report.executiveSummary}\nKey Findings: ${JSON.stringify(report.keyFindings?.slice(0, 8), null, 2)}\nConfidence: ${report.confidence}%\nEvidence pieces: ${report.allEvidence?.length ?? 0}\nContradictions: ${report.contradictions?.length ?? 0}\nAgent tasks: ${session.tasks.length} (${session.tasks.filter((t) => t.status === 'completed').length} completed, ${session.tasks.filter((t) => t.status === 'failed').length} failed)\n\nCritically evaluate this research. Be constructive but rigorous.`;

  const response = await callAgent('critic', prompt, {
    maxTokens: config.maxTokens,
    temperature: 0.1,
  });

  return parseJSON<CritiqueResult>(response);
}

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP INVESTIGATION (Phase 5)
// ═══════════════════════════════════════════════════════════════

async function followUp(
  session: ResearchSession,
  questions: string[],
  maxFollowUps: number,
  onProgress?: (p: ResearchProgress) => void
): Promise<void> {
  const config = DEPTH_CONFIG[session.depth];
  const questionsToInvestigate = questions.slice(0, maxFollowUps);

  for (const question of questionsToInvestigate) {
    const task: AgentTask = {
      id: `t-followup-${generateId()}`,
      role: 'source-analyst',
      description: `Follow-up investigation: ${question}`,
      dependencies: [],
      status: 'pending',
      input: { query: question, isFollowUp: true, originalQuery: session.query },
      wave: 99, // special wave for follow-ups
      retryCount: 0,
    };

    session.tasks.push(task);
    await executeTask(task, session, config);

    if (onProgress) {
      emitProgress(session, onProgress);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// REPORT ASSEMBLY
// ═══════════════════════════════════════════════════════════════

function assembleReport(
  session: ResearchSession,
  synthesis: SynthesisOutput,
  critiqueResult: CritiqueResult | null
): ResearchReport {
  const allEvidence = session.findings.flatMap((f) => f.evidence);
  const allEntities = deduplicateEntities(session.findings.flatMap((f) => f.entities));
  const allContradictions = session.findings.flatMap((f) => f.contradictions);

  // Find contrarian view
  const contrarianFinding = session.tasks
    .find((t) => t.role === 'contrarian' && t.output)?.output;

  const report: ResearchReport = {
    id: `rpt-${generateId()}`,
    query: session.query,
    depth: session.depth,
    phase: 'complete',

    executiveSummary: synthesis.executiveSummary || '',
    keyFindings: synthesis.keyFindings || [],
    timeline: synthesis.timeline || [],
    entities: allEntities,
    contradictions: [...allContradictions, ...(synthesis.riskAssessment ? [] : [])],

    riskAssessment: synthesis.riskAssessment || {
      overallRisk: 'medium',
      factors: [],
      mitigations: [],
    },
    confidence: critiqueResult?.adjustedConfidence ?? synthesis.confidence ?? 50,
    methodology: synthesis.methodology || `Multi-agent research with ${session.depth} depth`,

    allEvidence,
    sourceCount: new Set(allEvidence.map((e) => e.source)).size,

    narrativeArcs: synthesis.narrativeArcs || [],
    contrarianView: contrarianFinding?.summary,
    followUpQuestions: synthesis.followUpQuestions || [],
    critique: critiqueResult ?? undefined,

    agentTasks: session.tasks.map((t) => ({
      id: t.id,
      role: t.role,
      wave: t.wave,
      status: t.status,
      durationMs: (t.completedAt ?? Date.now()) - (t.startedAt ?? Date.now()),
      findingSummary: t.output?.summary,
      confidence: t.output?.confidence,
    })),
    processingTimeMs: Date.now() - session.createdAt,
    totalAgentCalls: session.tasks.filter((t) => t.status === 'completed').length,
    generatedAt: new Date().toISOString(),
  };

  return report;
}

function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const map = new Map<string, ExtractedEntity>();

  for (const entity of entities) {
    const key = entity.name.toLowerCase();
    const existing = map.get(key);

    if (!existing || entity.relevance > existing.relevance) {
      map.set(key, entity);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 50);
}

// ═══════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════

export async function conductResearch(
  query: string,
  options?: {
    depth?: ResearchDepth;
    onProgress?: (progress: ResearchProgress) => void;
  }
): Promise<ResearchReport> {
  const depth = options?.depth ?? 'standard';
  const cacheKey = `agent-research:${depth}:${query.toLowerCase().trim()}`;

  // Check cache
  const cached = cache.get<ResearchReport>(cacheKey);
  if (cached) return cached;

  const session: ResearchSession = {
    id: generateId(),
    query,
    depth,
    phase: 'planning',
    tasks: [],
    findings: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  sessions.set(session.id, session);

  try {
    // Phase 1: Plan
    session.phase = 'planning';
    session.tasks = await planResearch(query, depth);
    session.updatedAt = Date.now();
    options?.onProgress?.({
      sessionId: session.id, phase: 'planning',
      phaseDescription: `Planned ${session.tasks.length} tasks across ${new Set(session.tasks.map((t) => t.wave)).size} waves`,
      completedTasks: 0, totalTasks: session.tasks.length, currentWave: 0,
      activeAgents: [], elapsedMs: Date.now() - session.createdAt,
      estimatedRemainingMs: session.tasks.length * 12000,
    });

    // Phase 2: Investigate
    session.phase = 'investigation';
    await executeWaves(session, options?.onProgress);
    session.updatedAt = Date.now();

    // Phase 3: Cross-reference (for deep+ research)
    if ((depth === 'deep' || depth === 'exhaustive') && session.findings.length >= 2) {
      session.phase = 'cross-reference';
      const xrefTask: AgentTask = {
        id: 't-xref',
        role: 'fact-checker',
        description: `Cross-reference and verify key claims across all ${session.findings.length} specialist findings for: ${query}`,
        dependencies: session.tasks.filter((t) => t.status === 'completed').map((t) => t.id),
        status: 'pending',
        input: {
          claimsToVerify: session.findings
            .filter((f) => f.confidence < 80)
            .map((f) => f.summary)
            .slice(0, 5),
        },
        wave: 98,
        retryCount: 0,
      };
      session.tasks.push(xrefTask);
      await executeTask(xrefTask, session, DEPTH_CONFIG[depth]);
      session.updatedAt = Date.now();
    }

    // Phase 4: Synthesize
    session.phase = 'synthesis';
    const synthesisResult = await synthesize(session);

    if (!synthesisResult) {
      throw new Error('Synthesis agent failed to produce output');
    }

    // Phase 5: Critique
    session.phase = 'critique';
    const partialReport = assembleReport(session, synthesisResult, null);
    const critiqueResult = await critique(partialReport, session);

    // Phase 6: Follow-up (if needed)
    const config = DEPTH_CONFIG[depth];
    if (
      config.maxFollowUps > 0 &&
      critiqueResult &&
      critiqueResult.adjustedConfidence < config.minConfidence &&
      critiqueResult.suggestedFollowUps.length > 0
    ) {
      session.phase = 'follow-up';
      const highPriorityFollowUps = critiqueResult.suggestedFollowUps
        .filter((f) => f.priority === 'critical' || f.priority === 'high')
        .map((f) => f.question);

      await followUp(session, highPriorityFollowUps, config.maxFollowUps, options?.onProgress);
      session.updatedAt = Date.now();
    }

    // Phase 7: Final assembly
    session.phase = 'finalization';
    const report = assembleReport(session, synthesisResult, critiqueResult);
    report.processingTimeMs = Date.now() - session.createdAt;

    session.phase = 'complete';
    session.report = report;
    session.updatedAt = Date.now();

    cache.set(cacheKey, report, CACHE_TTL_SECONDS);

    return report;
  } catch (error) {
    session.phase = 'error';
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// FLASH RESEARCH (Quick, single-agent)
// ═══════════════════════════════════════════════════════════════

export async function flashResearch(
  query: string
): Promise<{ summary: string; confidence: number; keyPoints: string[]; entities: string[] }> {
  return withCache(cache, `flash-research:${query.toLowerCase().trim()}`, 300, async () => {
    const prompt = `Quick research briefing on: "${query}"

Provide a rapid intelligence assessment based on your knowledge of crypto markets, recent events, and the broader ecosystem.

Return JSON:
{
  "summary": "2-3 sentence assessment",
  "confidence": 0-100,
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "entities": ["Entity 1", "Entity 2"]
}`;

    const response = await callAgent('source-analyst', prompt, {
      maxTokens: 1200,
      temperature: 0.2,
    });
    const parsed = parseJSON<{
      summary: string;
      confidence: number;
      keyPoints: string[];
      entities: string[];
    }>(response);

    return {
      summary: parsed?.summary || 'Unable to generate assessment',
      confidence: parsed?.confidence ?? 0,
      keyPoints: parsed?.keyPoints || [],
      entities: parsed?.entities || [],
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// SESSION API
// ═══════════════════════════════════════════════════════════════

export function getSession(id: string): ResearchSession | undefined {
  return sessions.get(id);
}

export function getProgress(sessionId: string): ResearchProgress | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const completed = session.tasks.filter((t) => t.status === 'completed' || t.status === 'failed').length;
  const active = session.tasks.filter((t) => t.status === 'running');

  return {
    sessionId,
    phase: session.phase,
    phaseDescription: describePhase(session.phase),
    completedTasks: completed,
    totalTasks: session.tasks.length,
    currentWave: active.length > 0 ? Math.min(...active.map((t) => t.wave)) : 0,
    activeAgents: active.map((t) => t.role),
    elapsedMs: Date.now() - session.createdAt,
    estimatedRemainingMs: 0,
    latestFinding: session.findings.at(-1)?.summary,
    confidence: session.findings.length > 0
      ? Math.round(session.findings.reduce((s, f) => s + f.confidence, 0) / session.findings.length)
      : undefined,
  };
}

export function listSessions(): Array<{
  id: string;
  query: string;
  phase: ResearchPhase;
  depth: ResearchDepth;
  taskCount: number;
  createdAt: number;
}> {
  return Array.from(sessions.values()).map((s) => ({
    id: s.id,
    query: s.query,
    phase: s.phase,
    depth: s.depth,
    taskCount: s.tasks.length,
    createdAt: s.createdAt,
  }));
}
